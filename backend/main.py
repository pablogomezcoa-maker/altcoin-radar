from fastapi import FastAPI
import requests

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Altcoin Radar backend running"}


@app.get("/coins")
def get_coins():
    url = "https://api.coingecko.com/api/v3/coins/markets"

    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 20,
        "page": 1
    }

    response = requests.get(url, params=params)
    data = response.json()

    clean_data = []

    for coin in data:
        symbol = coin["symbol"].lower()
        name = coin["name"].lower()

        if symbol in ["usdt", "usdc"]:
            continue

        category = "OTHER"

        if "ai" in name:
            category = "AI"
        elif "dog" in name or "shib" in name or "pepe" in name:
            category = "MEME"
        elif "chain" in name or "layer" in name:
            category = "L2"
        elif "swap" in name or "finance" in name:
            category = "DEFI"
        elif "game" in name:
            category = "GAMING"
        elif "real" in name or "tokenized" in name:
            category = "RWA"

        change_24h = coin["price_change_percentage_24h"] or 0
        volume = coin["total_volume"]
        market_cap = coin["market_cap"]
        fdv = coin.get("fully_diluted_valuation") or market_cap

        fdv_ratio = fdv / market_cap if market_cap > 0 else 1
        accumulation = volume > (market_cap * 0.05)

        score = 0

        if change_24h > 5:
            score += 2
        elif change_24h > 0:
            score += 1
        elif change_24h < -5:
            score -= 1

        if accumulation:
            score += 2

        if fdv_ratio < 1.5:
            score += 1

        risk_flag = "LOW"

        if fdv_ratio > 3:
            risk_flag = "HIGH"
            score -= 2
        elif fdv_ratio > 2:
            risk_flag = "MEDIUM"
            score -= 1

        signal = "WATCH"

        if score >= 4 and risk_flag == "LOW":
            signal = "BUY"
        elif score <= 0 or risk_flag == "HIGH":
            signal = "AVOID"

        clean_data.append({
            "name": coin["name"],
            "symbol": coin["symbol"],
            "category": category,
            "signal": signal,
            "price": coin["current_price"],
            "rank": coin["market_cap_rank"],
            "market_cap": market_cap,
            "fdv": fdv,
            "fdv_ratio": round(fdv_ratio, 2),
            "change_24h": round(change_24h, 2),
            "volume": volume,
            "accumulation": accumulation,
            "risk_flag": risk_flag,
            "score": score
        })

    clean_data = sorted(
        clean_data,
        key=lambda x: x["score"],
        reverse=True
    )

    return clean_data