from uagents import Agent, Context
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"))
contract_address = "YOUR_CONTRACT_ADDRESS"
contract_abi = [...]  # Paste your smart contract ABI here
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

risk_assessment_agent = Agent(name="risk_assessment", seed="risk recovery phrase")

@risk_assessment_agent.on_interval(period=60.0)
async def assess_risks(ctx: Context):
    bet_counter = contract.functions.betCounter().call()
    high_risk_bets = []
    
    for bet_id in range(bet_counter):
        bet = contract.functions.bets(bet_id).call()
        if bet[6] and bet[2] > Web3.toWei(5, 'ether'): 
            high_risk_bets.append(bet_id)
    
    ctx.logger.info(f"High-risk bets: {high_risk_bets}")
    ctx.storage.set("high_risk_bets", high_risk_bets)