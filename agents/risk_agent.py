from uagents import Agent, Context
from datetime import datetime, timedelta
import os
import logging
import time
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
from threading import Thread

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)
mongo_uri = os.getenv("MONGO_URI")

# MongoDB setup
client = MongoClient(mongo_uri)
db = client["test"]
bets_collection = db["bets"]
user_collection = db["users"]

class RiskMetrics:
    def __init__(self):
        self.bet_frequency = 0
        self.avg_bet_size = 0.0
        self.loss_streak = 0
        self.total_volume_24h = 0.0
        self.risk_score = 0.0

class RiskManagementAgent(Agent):
    def __init__(self, name: str):
        super().__init__(name=name)
        self.risk_thresholds = {
            "low": 30,
            "medium": 60,
            "high": 80
        }
        # Start monitoring in a separate thread
        self.monitor_thread = Thread(target=self.monitor_bets)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()

    def monitor_bets(self):
        """Monitor MongoDB for new bet entries and updates"""
        try:
            # Create a change stream to watch for new bets and updates
            pipeline = [
                {'$match': {
                    'operationType': {'$in': ['insert', 'update']},
                }}
            ]
            
            # Start watching the collection with the pipeline
            with bets_collection.watch(
                pipeline,
                full_document='updateLookup'
            ) as change_stream:
                for change in change_stream:
                    if change['operationType'] in ['insert', 'update']:
                        bet = change['fullDocument']
                        
                        # Evaluate risk for creator
                        self.evaluate_bet(bet['creator'], float(bet['amount']))
                        
                        # Evaluate risk for participant if they exist
                        if bet.get('participant') and bet['participant'] != 'TBD':
                            self.evaluate_bet(bet['participant'], float(bet['amount']))
                            
                        # Store the bet risk context
                        self.store_bet_risk_context(bet)

        except Exception as e:
            logging.error(f"Error in change stream: {e}")
            # Wait before trying to reconnect
            time.sleep(5)
            self.monitor_bets()

    def store_bet_risk_context(self, bet: dict):
        """Store risk context for the entire bet"""
        bet_id = bet['_id']
        creator_risk = self.evaluate_bet(bet['creator'], float(bet['amount']))
        participant_risk = None
        
        if bet.get('participant') and bet['participant'] != 'TBD':
            participant_risk = self.evaluate_bet(bet['participant'], float(bet['amount']))
        
        # Store the combined risk context
        bets_collection.update_one(
            {'_id': bet_id},
            {
                '$set': {
                    'risk_context': {
                        'creator_risk': creator_risk,
                        'participant_risk': participant_risk,
                        'evaluated_at': datetime.utcnow(),
                        'combined_risk_score': creator_risk['risk_score'] + (participant_risk['risk_score'] if participant_risk else 0) / (2 if participant_risk else 1)
                    }
                }
            }
        )

    def generate_risk_message(self, risk_score: float, metrics: RiskMetrics) -> str:
        """Generate a detailed risk information message based on metrics"""
        if risk_score >= self.risk_thresholds["high"]:
            message = (
                "High Risk Alert:\n"
                f"• You've placed {metrics.bet_frequency} bets in the last 24 hours\n"
                f"• Your average bet size is {metrics.avg_bet_size:.2f}\n"
                f"• Total volume wagered: {metrics.total_volume_24h:.2f}\n"
                f"• Current loss streak: {metrics.loss_streak}\n"
                "Consider taking a break or setting lower betting limits."
            )
        elif risk_score >= self.risk_thresholds["medium"]:
            message = (
                "Risk Warning:\n"
                f"• Betting frequency has increased\n"
                f"• Average bet size: {metrics.avg_bet_size:.2f}\n"
                f"• Total volume wagered: {metrics.total_volume_24h:.2f}\n"
                "Consider your betting patterns and stay within comfortable limits."
            )
        else:
            message = "Low risk level. Enjoy responsible betting!"
        
        return message

    def calculate_risk_score(self, wallet_address: str) -> tuple[float, RiskMetrics]:
        # Get user's betting history from last 24 hours
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        recent_bets = list(bets_collection.find({
            "$or": [
                {"creator": wallet_address},
                {"participant": wallet_address}
            ],
            "created_at": {"$gte": twenty_four_hours_ago}
        }))

        metrics = RiskMetrics()
        metrics.bet_frequency = len(recent_bets)
        
        if metrics.bet_frequency > 0:
            total_bet_amount = sum(bet["amount"] for bet in recent_bets)
            metrics.avg_bet_size = total_bet_amount / metrics.bet_frequency
            metrics.total_volume_24h = total_bet_amount

            # Calculate loss streak
            outcomes = [bet.get("outcome", {}).get("status", "") for bet in recent_bets]
            current_streak = 0
            for outcome in reversed(outcomes):
                if outcome == "lost":
                    current_streak += 1
                else:
                    break
            metrics.loss_streak = current_streak

        # Calculate risk score
        risk_score = (
            (metrics.bet_frequency * 10) +
            (metrics.avg_bet_size * 5) +
            (metrics.loss_streak * 15)
        ) / 3

        return min(100, risk_score), metrics

    def evaluate_bet(self, wallet_address: str, bet_amount: float):
        """Evaluate bet risk and store results for a single wallet"""
        risk_score, metrics = self.calculate_risk_score(wallet_address)
        
        # Generate informative message based on risk level
        risk_message = self.generate_risk_message(risk_score, metrics)
        
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
                    },
                    "risk_message": risk_message
                }
            },
            upsert=True
        )

        return {
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

if __name__ == "__main__":
    agent = RiskManagementAgent("risk_manager")
    agent.run()