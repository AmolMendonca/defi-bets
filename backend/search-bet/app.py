from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from rapidfuzz import process, fuzz 

app = FastAPI()

bets = [
    {"id": 1, "title": "Bitcoin Price Prediction", "description": "Bet on Bitcoin reaching $100,000"},
    {"id": 2, "title": "Ethereum Staking Rewards", "description": "Bet on Ethereum staking yield exceeding 5%"},
    {"id": 3, "title": "Dogecoin to the Moon", "description": "Bet on Dogecoin doubling its market cap"},
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

##fuzzy search
@app.get("/search", response_model=List[dict])
def search_bets_by_title(query: str):
    titles = []
    for bet in bets:
        titles.append(bet["title"])

    matches = process.extract(query, titles, scorer=fuzz.partial_ratio, limit=5)

    results = []
    for bet in bets:
        for match in matches:
            if match[0] == bet["title"] and match[1] > 60:
                results.append(bet)
                break 
    

    if not results:
        raise HTTPException(status_code=404, detail="No bets found matching the query")
    
    return results
