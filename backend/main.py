from typing import Any

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Altcoin Radar API",
    version="1.0.0",
)


# Permite que la página de Vercel consulte este backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets"


def to_number(value: Any, default: float = 0.0) -> float:
    """
    Convierte un valor en número de manera segura.
    Si CoinGecko entrega un dato vacío, devuelve el valor predeterminado.
    """
    try:
        if value is None:
            return default

        return float(value)
    except (TypeError, ValueError):
        return default


def get_category(name: str, symbol: str) -> str:
    """
    Clasificación sencilla de cada criptomoneda.
    """
    text = f"{name} {symbol}".lower()

    if "artificial" in text or " ai " in f" {text} ":
        return "AI"

    if any(word in text for word in ["dog", "shib", "pepe", "floki", "bonk"]):
        return "MEME"

    if any(word in text for word in ["chain", "layer", "rollup"]):
        return "L2"

    if any(word in text for word in ["swap", "finance", "defi"]):
        return "DEFI"

    if any(word in text for word in ["game", "gaming", "play"]):
        return "GAMING"

    if any(word in text for word in ["real world", "tokenized", "rwa"]):
        return "RWA"

    return "OTHER"


@app.get("/")
def home():
    return {
        "message": "Altcoin Radar backend running",
        "status": "ok",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.get("/coins")
def get_coins():
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 20,
        "page": 1,
        "sparkline": "false",
        "price_change_percentage": "24h",
    }

    headers = {
        "Accept": "application/json",
        "User-Agent": "AltcoinRadar/1.0",
    }

    try:
        response = requests.get(
            COINGECKO_URL,
            params=params,
            headers=headers,
            timeout=25,
        )
    except requests.Timeout as error:
        raise HTTPException(
            status_code=503,
            detail="CoinGecko tardó demasiado en responder.",
        ) from error
    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=f"No fue posible conectarse con CoinGecko: {error}",
        ) from error

    if response.status_code != 200:
        try:
            error_content = response.json()
        except ValueError:
            error_content = response.text[:300]

        raise HTTPException(
            status_code=503,
            detail={
                "message": "CoinGecko no pudo entregar las monedas.",
                "coingecko_status": response.status_code,
                "coingecko_response": error_content,
            },
        )

    try:
        data = response.json()
    except ValueError as error:
        raise HTTPException(
            status_code=503,
            detail="CoinGecko respondió, pero no entregó un JSON válido.",
        ) from error

    # La respuesta correcta debe ser una lista.
    if not isinstance(data, list):
        raise HTTPException(
            status_code=503,
            detail={
                "message": "CoinGecko no devolvió una lista de monedas.",
                "received_type": type(data).__name__,
                "received_data": data,
            },
        )

    clean_data = []

    for coin in data:
        # Evita que el programa se caiga si aparece un elemento incorrecto.
        if not isinstance(coin, dict):
            continue

        original_name = str(coin.get("name") or "").strip()
        original_symbol = str(coin.get("symbol") or "").strip()

        if not original_name or not original_symbol:
            continue

        name = original_name.lower()
        symbol = original_symbol.lower()

        # Excluir monedas estables.
        if symbol in {"usdt", "usdc", "dai", "fdusd", "usde"}:
            continue

        category = get_category(name, symbol)

        change_24h = to_number(
            coin.get("price_change_percentage_24h")
        )

        volume = to_number(coin.get("total_volume"))
        market_cap = to_number(coin.get("market_cap"))

        fdv = to_number(
            coin.get("fully_diluted_valuation"),
            market_cap,
        )

        if fdv <= 0:
            fdv = market_cap

        fdv_ratio = (
            fdv / market_cap
            if market_cap > 0
            else 1.0
        )

        accumulation = (
            market_cap > 0
            and volume > market_cap * 0.05
        )

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

        clean_data.append(
            {
                "name": original_name,
                "symbol": original_symbol,
                "category": category,
                "signal": signal,
                "price": to_number(coin.get("current_price")),
                "rank": coin.get("market_cap_rank"),
                "market_cap": market_cap,
                "fdv": fdv,
                "fdv_ratio": round(fdv_ratio, 2),
                "change_24h": round(change_24h, 2),
                "volume": volume,
                "accumulation": accumulation,
                "risk_flag": risk_flag,
                "score": score,
            }
        )

    clean_data = sorted(
        clean_data,
        key=lambda item: item["score"],
        reverse=True,
    )

    return clean_data