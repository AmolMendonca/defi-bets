from uagents import Agent, Context, Model

class EvidenceMessage(Model):
    content: str

evidence_collector_agent = Agent(name="evidence_collector", seed="evidence recovery phrase")

@evidence_collector_agent.on_interval(period=60.0)
async def collect_evidence(ctx: Context):
    # Collect evidence (as before)
    bet_counter = contract.functions.betCounter().call()
    evidence = {}
    
    for bet_id in range(bet_counter):
        bet = contract.functions.bets(bet_id).call()
        if bet[6]:  # Check if the bet is disputed
            evidence[bet_id] = {
                "creator": bet[0],
                "participant": bet[1],
                "amount": bet[2],
                "resolved": bet[3],
                "winner": bet[4],
                "disputed": bet[6],
                "creator_confirmed": bet[7],
                "participant_confirmed": bet[8],
            }
    
    ctx.logger.info(f"Collected evidence: {evidence}")
    ctx.storage.set("evidence", evidence)

    # Search for the dispute_monitor_agent
    query = "dispute_monitor"
    results = await ctx.search(query)
    if results:
        dispute_monitor_address = results[0].address  
        ctx.logger.info(f"Found dispute_monitor_agent at {dispute_monitor_address}")
        
        await ctx.send(dispute_monitor_address, EvidenceMessage(content="New evidence collected"))