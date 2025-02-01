from uagents import Agent, Context
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"))
contract_address = ""
contract_abi = [...]  
contract = w3.eth.contract(address=contract_address, abi=contract_abi)
dispute_monitor_agent = Agent(name="dispute_monitor", seed="dispute recovery phrase")

@dispute_monitor_agent.on_interval(period=60.0) 

async def monitor_disputes(ctx: Context):
    dispute_counts = {}
    bet_counter = contract.functions.betCounter().call()
    
    for bet_id in range(bet_counter):
        bet = contract.functions.bets(bet_id).call()
        if bet[6]:  
            creator = bet[0]
            participant = bet[1]
            
            dispute_counts[creator] = dispute_counts.get(creator, 0) + 1
            dispute_counts[participant] = dispute_counts.get(participant, 0) + 1
    
    frequent_disputers = {addr: count for addr, count in dispute_counts.items() if count > 3}
    ctx.logger.info(f"Frequent disputers: {frequent_disputers}")
    ctx.storage.set("frequent_disputers", frequent_disputers)

# Define a message model for communication
class EvidenceMessage(Model):
    content: str

# Dispute Monitoring Agent
dispute_monitor_agent = Agent(name="dispute_monitor", seed="dispute recovery phrase")

@dispute_monitor_agent.on_message(model=EvidenceMessage)
async def handle_message(ctx: Context, sender: str, msg: EvidenceMessage):
    ctx.logger.info(f"Received message from {sender}: {msg.content}")