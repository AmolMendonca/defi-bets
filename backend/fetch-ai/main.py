from flask import Flask, jsonify
from agents.dispute_monitor import dispute_monitor_agent
from agents.evidence_collector import evidence_collector_agent
from agents.risk_assessment import risk_assessment_agent
from agents.reputation_scoring import reputation_agent

app = Flask(__name__)

@app.route('/api/frequent-disputers', methods=['GET'])
def get_frequent_disputers():
    return jsonify(dispute_monitor_agent.storage.get("frequent_disputers"))

@app.route('/api/evidence', methods=['GET'])
def get_evidence():
    return jsonify(evidence_collector_agent.storage.get("evidence"))

@app.route('/api/high-risk-bets', methods=['GET'])
def get_high_risk_bets():
    return jsonify(risk_assessment_agent.storage.get("high_risk_bets"))

@app.route('/api/reputation-scores', methods=['GET'])
def get_reputation_scores():
    return jsonify(reputation_agent.storage.get("reputation_scores"))

if __name__ == '__main__':
    app.run(debug=True, port=5001)
