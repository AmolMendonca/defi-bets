from web3 import Web3
from pymongo import MongoClient
from datetime import datetime, timedelta
import asyncio
import json
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)
mongo_uri = os.getenv("MONGO_URI")

class BettingListener:
    def __init__(self, contract_address, rpc_url):
        # MongoDB setup
        self.mongo_client = MongoClient(mongo_uri)
        self.db = self.mongo_client["main"]
        self.bets_collection = self.db["bets"]
        self.user_collection = self.db['users']

        # Web3 setup
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        # Contract setup
        with open('artifacts/BettingWithInsuranceAndYield.json', 'r') as f:
            contract_json = json.load(f)
            self.contract = self.w3.eth.contract(
                address=contract_address,
                abi=contract_json['abi']
            )

    async def listen_for_bets(self):
        """Listen for betting events from the contract"""
        event_filter = self.contract.events.BetCreated.create_filter(fromBlock='latest')
        
        # Create indexes for better query performance
        self.bets_collection.create_index([("bet_id", 1)], unique=True)
        self.bets_collection.create_index([("creator", 1)])
        self.bets_collection.create_index([("participant", 1)])
        self.bets_collection.create_index([("created_at", 1)])
        self.user_metrics_collection.create_index([("wallet_address", 1)], unique=True)
        
        print(f"🎲 Starting to monitor bets on contract: {self.contract.address}")
        
        while True:
            try:
                events = event_filter.get_new_entries()
                for event in events:
                    await self.handle_new_bet(event)
            except Exception as e:
                print(f"Error polling events: {e}")
            await asyncio.sleep(1)  # Poll every second

    async def handle_new_bet(self, event):
        """Process a new bet event"""
        try:
            bet_data = {
                "bet_id": event.args.betId,
                "creator": event.args.creator,
                "participant": event.args.participant,
                "amount": float(self.w3.from_wei(event.args.amount, 'ether')),
                "created_at": datetime.fromtimestamp(event.args.createdAt),
                "insurance_opted": event.args.insuranceOpted,
                "blockchain_data": {
                    "transaction_hash": event.transactionHash.hex(),
                    "block_number": event.blockNumber
                }
            }
            
            # Store in MongoDB
            await self.bets_collection.insert_one(bet_data)
            
            # Update metrics for both users
            await self.update_user_metrics(event.args.creator)
            await self.update_user_metrics(event.args.participant)
            
            print(f"✅ Processed bet {bet_data['bet_id']} between {bet_data['creator']} and {bet_data['participant']}")
            
        except Exception as e:
            print(f"Error handling bet: {e}")

    async def update_user_metrics(self, wallet_address):
        """Update risk metrics for a user based on their betting history"""
        try:
            recent_bets = list(self.bets_collection.find({
                "$or": [
                    {"creator": wallet_address},
                    {"participant": wallet_address}
                ],
                "created_at": {
                    "$gte": datetime.utcnow() - timedelta(hours=24)
                }
            }))

            if not recent_bets:
                return

            # Calculate metrics
            bet_frequency = len(recent_bets)
            total_volume = sum(bet['amount'] for bet in recent_bets)
            avg_bet_size = total_volume / bet_frequency

            # Update user metrics
            self.user_collection.update_one(
                {"wallet_address": wallet_address},
                {
                    "$set": {
                        "last_updated": datetime.utcnow(),
                        "metrics": {
                            "bet_frequency_24h": bet_frequency,
                            "avg_bet_size": avg_bet_size,
                            "total_volume_24h": total_volume,
                            "last_bet_time": recent_bets[-1]['created_at']
                        }
                    }
                },
                upsert=True
            )

        except Exception as e:
            print(f"Error updating metrics for {wallet_address}: {e}")

def main():
    # Your deployed contract address and RPC URL
    CONTRACT_ADDRESS = "0x6745a2a615BA2417B06834DB753E35Ba4AC53857"  
    RPC_URL = os.getenv("ALCHEMY_API_KEY") 
    
    listener = BettingListener(CONTRACT_ADDRESS, RPC_URL)
    
    # Run the listener
    asyncio.run(listener.listen_for_bets())

if __name__ == "__main__":
    main()