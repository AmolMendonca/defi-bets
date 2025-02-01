from uagents import Agent, Context
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"))
contract_address = "YOUR_CONTRACT_ADDRESS"
contract_abi = [...]  
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

reputation_agent = Agent(name="reputation", seed="reputation recovery phrase")

@reputation_agent.on_interval(period=120.0)
async def calculate_reputation(ctx: Context):
    reputation_scores = {}
    bet_counter = contract.functions.betCounter().call()
    
    for bet_id in range(bet_counter):
        bet = contract.functions.bets(bet_id).call()
        creator = bet[0]
        participant = bet[1]
        winner = bet[4]
        
        if winner == creator:
            reputation_scores[creator] = reputation_scores.get(creator, 0) + 1
            reputation_scores[participant] = reputation_scores.get(participant, 0) - 1
        elif winner == participant:
            reputation_scores[participant] = reputation_scores.get(participant, 0) + 1
            reputation_scores[creator] = reputation_scores.get(creator, 0) - 1
    
    ctx.logger.info(f"Reputation scores: {reputation_scores}")
    ctx.storage.set("reputation_scores", reputation_scores)