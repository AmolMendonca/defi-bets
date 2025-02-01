from uagents import Agent, Context, Protocol
from uagents.crypto import Address
from datetime import datetime, timedelta
import pymongo
from typing import Dict
import os
import logging
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
from uagents import Model

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)
mongo_uri = os.getenv("MONGO_URI")

# MongoDB setup
client = MongoClient(mongo_uri)
db = client["betting_risk_db"]
bets_collection = db["bets"]
user_collection = db['users']

class RiskMetrics:
    def __init__(self):
        self.bet_frequency = 0
        self.avg_bet_size = 0.0
        self.loss_streak = 0
        self.total_volume_24h = 0.0
        self.risk_score = 0.0
        
class RiskRequest(Model):
    wallet_address: str
    bet_amount: float

class RiskManagementAgent(Agent):
    def __init__(self, name: str):
        super().__init__(name=name)
        self.risk_thresholds = {
            "low": 30,
            "medium": 60,
            "high": 80
        }
    
    def generate_risk_message(self, risk_score: float, metrics: RiskMetrics) -> str:
        """Generate a detailed risk information message based on metrics"""
        if risk_score >= self.risk_thresholds["high"]:
            message = (
                "\U00026A0 High Risk Alert:\n"
                f"• You've placed {metrics.bet_frequency} bets in the last 24 hours\n"
                f"• Your average bet size is {metrics.avg_bet_size:.2f}\n"
                f"• Total volume wagered: {metrics.total_volume_24h:.2f}\n"
                f"• Current loss streak: {metrics.loss_streak}\n"
                "Consider taking a break or setting lower betting limits."
            )
        elif risk_score >= self.risk_thresholds["medium"]:
            message = (
                "\U00026A0 Risk Warning:\n"
                f"• Betting frequency has increased\n"
                f"• Average bet size: {metrics.avg_bet_size:.2f}\n"
                f"• Total volume wagered: {metrics.total_volume_24h:.2f}\n"
                "Consider your betting patterns and stay within comfortable limits."
            )
        else:
            message = "Low risk level. Enjoy responsible betting!"
        
        return message

    async def calculate_risk_score(self, wallet_address: str) -> tuple[float, RiskMetrics]:
        # Get user's betting history from last 24 hours
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        recent_bets = bets_collection.find({
            "$or": [
                {"creator": wallet_address},
                {"participant": wallet_address}
            ],
            "created_at": {"$gte": twenty_four_hours_ago}
        })

        metrics = RiskMetrics()
        bets = list(recent_bets)
        metrics.bet_frequency = len(bets)
        
        if metrics.bet_frequency > 0:
            total_bet_amount = sum(bet["amount"] for bet in bets)
            metrics.avg_bet_size = total_bet_amount / metrics.bet_frequency
            metrics.total_volume_24h = total_bet_amount

            # Calculate loss streak
            outcomes = [bet.get("outcome", {}).get("status", "") for bet in bets]
            current_streak = 0
            for outcome in reversed(outcomes):
                if outcome == "lost":
                    current_streak += 1
                else:
                    break
            metrics.loss_streak = current_streak

        # Calculate risk score (updated version)
        risk_score = (
            (metrics.bet_frequency * 10) +
            (metrics.avg_bet_size * 5) +
            (metrics.loss_streak * 15)
        ) / 3

        return min(100, risk_score), metrics

    async def evaluate_bet(self, ctx: Context, wallet_address: str, bet_amount: float):
        risk_score, metrics = await self.calculate_risk_score(wallet_address)
        
        # Generate informative message based on risk level
        risk_message = self.generate_risk_message(risk_score, metrics)
        
        response = {
            "wallet_address": wallet_address,
            "risk_score": risk_score,
            "risk_level": "low" if risk_score < self.risk_thresholds["medium"] else 
                         "medium" if risk_score < self.risk_thresholds["high"] else 
                         "high",
            "message": risk_message,
            "metrics": {
                "bet_frequency_24h": metrics.bet_frequency,
                "avg_bet_size": metrics.avg_bet_size,
                "total_volume_24h": metrics.total_volume_24h,
                "current_loss_streak": metrics.loss_streak
            }
        }

        # Store the risk evaluation
        user_collection.update_one(
            {"wallet_address": wallet_address},
            {
                "$set": {
                    "last_risk_score": risk_score,
                    "last_evaluated": datetime.utcnow(),
                    "current_metrics": {
                        "bet_frequency_24h": metrics.bet_frequency,
                        "avg_bet_size": metrics.avg_bet_size,
                        "total_volume_24h": metrics.total_volume_24h,
                        "current_loss_streak": metrics.loss_streak
                    }
                }
            },
            upsert=True
        )

        return response

# Protocol for handling bet requests
bet_protocol = Protocol()

@bet_protocol.on_message(model=RiskRequest)
async def handle_bet_request(ctx: Context, sender: Address, msg: RiskRequest):
    wallet_address = msg.wallet_address
    bet_amount = msg.bet_amount

    if not wallet_address or not bet_amount:
        await ctx.send(sender, {"error": "Invalid request parameters"})
        return

    risk_evaluation = await ctx.agent.evaluate_bet(ctx, wallet_address, bet_amount)
    await ctx.send(sender, risk_evaluation)

# Create and run the agent
agent = RiskManagementAgent("risk_manager")
agent.include(bet_protocol)

if __name__ == "__main__":
    agent.run()
