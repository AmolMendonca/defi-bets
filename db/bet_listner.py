import requests
from web3 import Web3
from web3.middleware import validation
from pymongo import MongoClient
from datetime import datetime, timedelta
import asyncio
import json
import os
import logging
from dotenv import load_dotenv
from pathlib import Path
from uagents.network import Network
from uagents import Model

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)
mongo_uri = os.getenv("MONGO_URI")
abi_file_path = Path(__file__).parent / "betting_abi.json"

with open(abi_file_path, "r") as file:
    betting_abi_data = json.load(file)

contract_abi = betting_abi_data["abi"]

class RiskRequest(Model):
    wallet_address: str
    bet_amount: float

class BettingListener:
    def __init__(self, contract_address, rpc_url, etherscan_api_key):
        # MongoDB setup
        try:
            self.mongo_client = MongoClient(mongo_uri)
            self.db = self.mongo_client["main"]
            self.bets_collection = self.db["bets"]
            self.user_collection = self.db['users']
            logging.info("Connected to MongoDB successfully.")
        except Exception as e:
            logging.error(f"Failed to connect to MongoDB: {e}")
            raise

        # Web3 setup
        # self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        try:
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            if self.w3.is_connected():
                logging.info("Connected to Ethereum network successfully.")
            else:
                logging.error("Failed to connect to Ethereum network.")
                raise ConnectionError("Web3 connection failed")
        except Exception as e:
            logging.error(f"Web3 connection error: {e}")
            raise
        
        # Contract setup
        self.w3.eth.account.enable_unaudited_hdwallet_features()
        
        
        # self.contract = self.w3.eth.contract(
        #     address=contract_address,
        #     abi=contract_abi
        # )
        
        try:
            self.contract = self.w3.eth.contract(
                address=contract_address,
                abi=contract_abi
            )
            logging.info(f"Connected to contract at address: {contract_address}")
        except Exception as e:
            logging.error(f"Failed to connect to smart contract: {e}")
            raise
        
        self.network = Network()
        self.agent_address = "risk_manager"

    async def listen_for_bets(self):
        """Listen for betting events from the contract"""
        event_filter = self.contract.events.BetCreated.create_filter(from_block='latest')
        
        # Create indexes for better query performance
        self.bets_collection.create_index([("bet_id", 1)], unique=True)
        self.bets_collection.create_index([("creator", 1)])
        self.bets_collection.create_index([("participant", 1)])
        self.bets_collection.create_index([("created_at", 1)])
        
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
            
            await self.send_risk_request(event.args.creator, bet_data["amount"])
            await self.send_risk_request(event.args.participant, bet_data["amount"])
            
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

    async def send_risk_request(self, wallet_address, bet_amount):
        """Send a message to the RiskManagementAgent to evaluate risk."""
        risk_request = RiskRequest(wallet_address=wallet_address, bet_amount=bet_amount)
        await self.network.send(self.agent_address, risk_request)

def main():
    # Your deployed contract address and RPC URL
    CONTRACT_ADDRESS = "0x6745a2a615BA2417B06834DB753E35Ba4AC53857"  
    RPC_URL = os.getenv("ALCHEMY_API_KEY")
    ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")
    
    listener = BettingListener(CONTRACT_ADDRESS, RPC_URL, ETHERSCAN_API_KEY)
    
    # Run the listener
    asyncio.run(listener.listen_for_bets())

if __name__ == "__main__":
    main()