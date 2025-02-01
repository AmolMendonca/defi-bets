from pymongo import MongoClient
import sys
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)
mongo_uri = os.getenv("MONGO_URI")

def test_mongo_connection():
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        db = client.admin  # Use the admin database to run a ping command
        response = db.command("ping")
        print("MongoDB Connection Successful:", response)
    except Exception as e:
        print("MongoDB Connection Failed:", str(e))
        sys.exit(1)

if __name__ == "__main__":
    test_mongo_connection()
