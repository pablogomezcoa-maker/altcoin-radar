async function getCoins() {
  const res = await fetch("https://altcoin-radar-ubo5.onrender.com/coins", {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home() {
  const coins = await getCoins();

  return (
    <main
      style={{
        padding: "20px",
        background: "#0f172a",
        minHeight: "100vh",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <h1>🚀 Altcoin Radar Live</h1>

      <p>Total Coins: {coins.length}</p>

      <div
        style={{
          display: "grid",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {coins.map((coin: any, index: number) => (
          <div
            key={index}
            style={{
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "20px",
              background: "#1e293b",
            }}
          >
            <h2>
              #{coin.rank} {coin.name} ({coin.symbol.toUpperCase()})
            </h2>

            <p>💵 Price: ${coin.price}</p>
            <p>📊 24h Change: {coin.change_24h}%</p>
            <p>🏦 Market Cap: ${coin.market_cap}</p>
            <p>💧 Volume: ${coin.volume}</p>
            <p>⭐ Score: {coin.score}</p>
            <p>⚠ Risk: {coin.risk_flag}</p>
            <p>🧠 Category: {coin.category}</p>
            <p>📈 Accumulation: {coin.accumulation ? "YES" : "NO"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}