from typing import Optional
import httpx


def ai(
    query: str,
    protocol: Optional[
        str
    ] = "proto:a03398ea81d7aaaf67e72940937676eae0d019f8e1d8b5efbadfef9fd2e98bb2",
) -> dict:
    url = "https://agentverse.ai/v1/search/agents"
    headers = {
        "Content-Type": "application/json",
    }

    data = {
        "search_text": query,
        "sort": "relevancy",
        "filters": {
            "protocol_digest": [protocol],
        },
        # "geo_filter": {
        #     "latitude": 52.19652,
        #     "longitude": 0.1313,
        #     "radius": 1000
        # },
        # Sort options: relevancy, created-at, last-modified, interactions
        "direction": "asc",  # Ascending order; use "desc" for descending
        "offset": 0,
        "limit": 10,
    }

    try:
        response = httpx.post(url, json=data, headers=headers, timeout=10.0)
        return {"ais": response.json().get("agents", [])}
    except httpx.RequestError as exc:
        return {"ais": [], "error": f"{exc}"}
