from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from rapidfuzz import process, fuzz
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI()

MONGO_DETAILS = "mongodb+srv://rhwang1226:seiyakuwinssparta@cluster0.d7gcw.mongodb.net/"
DATABASE_NAME = "main"
COLLECTION_NAME = "bets"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(MONGO_DETAILS)
    app.database = app.mongodb_client[DATABASE_NAME]
    print("Connected to the MongoDB database!")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()
    print("Closed connection to the MongoDB database.")

@app.get("/search", response_model=List[dict])
async def search_bets_by_title(query: Optional[str] = None):
    """
    Search bets by their titles.
    If no query is provided, return all bets.
    """
    bets = []
    cursor = app.database[COLLECTION_NAME].find({})
    async for bet in cursor:
        bets.append(bet)

    # If no query is provided, return all bets
    if not query:
        for bet in bets:
            if "_id" in bet:
                bet["id"] = str(bet["_id"])
                del bet["_id"]
        return bets

    # Extract titles for fuzzy matching
    titles = [bet["title"] for bet in bets if "title" in bet]

    # Perform fuzzy search
    matches = process.extract(query, titles, scorer=fuzz.partial_ratio, limit=5)

    results = []
    for bet in bets:
        for match in matches:
            if match[0] == bet["title"] and match[1] > 60:
                results.append(bet)
                break

    if not results:
        raise HTTPException(status_code=404, detail="No bets found matching the query")

    for result in results:
        if "_id" in result:
            result["id"] = str(result["_id"])
            del result["_id"]

    return results
