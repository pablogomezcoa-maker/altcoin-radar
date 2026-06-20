export const revalidate = 30;

export default async function Home() {
  const response = await fetch("http://127.0.0.1:8000/coins", {
    next: { revalidate: 30 }
  });

  const coins = await response.json();

  const topCoins = coins.slice(0, 3);

  const totalCoins = coins.length;
  const aiCoins = coins.filter((coin: any) => coin.category === "AI").length;
  const lowRiskCoins = coins.filter(
    (coin: any) => coin.risk_flag === "LOW"
  ).length;

  const buySignals = coins.filter(
    (coin: any) => coin.signal === "BUY"
  ).length;

  const avgScore =
    coins.reduce((acc: number, coin: any) => acc + coin.score, 0) /
    totalCoins;

  return (
    <main
      style={{
        padding: "30px",
        backgroundColor: "#0b132b",
        minHeight: "100vh",
        color: "white"
      }}
    >
      <h1>🚀 Altcoin Radar Live</h1>

      <div style={{ marginBottom: "30px" }}>
        <p>📊 Total Coins: {totalCoins}</p>
        <p>🟣 AI Coins: {aiCoins}</p>
        <p>🛡 Low Risk: {lowRiskCoins}</p>
        <p>🟢 Buy Signals: {buySignals}</p>
        <p>⭐ Avg Score: {avgScore.toFixed(2)}</p>
        <p>🔄 Auto refresh: every 30s</p>
      </div>

      <h2>🏆 Top Opportunities</h2>

      {topCoins.map((coin: any, index: number) => (
        <div
          key={coin.symbol}
          style={{
            backgroundColor: "#1c2a44",
            padding: "20px",
            marginBottom: "15px",
            borderRadius: "15px"
          }}
        >
          <h3>
            #{index + 1} {coin.name} ({coin.symbol.toUpperCase()})
          </h3>

          <p>⭐ Score: {coin.score}</p>
          <p>📈 Change: {coin.change_24h}%</p>
          <p>🚨 Signal: {coin.signal}</p>
        </div>
      ))}

      <h2 style={{ marginTop: "40px" }}>📊 Full Radar</h2>

      {coins.map((coin: any, index: number) => (
        <div
          key={coin.symbol}
          style={{
            border:
              coin.risk_flag === "LOW"
                ? "2px solid lime"
                : coin.risk_flag === "MEDIUM"
                ? "2px solid yellow"
                : "2px solid red",
            backgroundColor: "#1c2a44",
            padding: "20px",
            marginBottom: "15px",
            borderRadius: "15px"
          }}
        >
          <h3>
            #{index + 1} {coin.name} ({coin.symbol.toUpperCase()})
          </h3>

          <p>📂 Category: {coin.category}</p>
          <p>💲 Price: ${coin.price}</p>
          <p>📈 24h Change: {coin.change_24h}%</p>
          <p>💧 Volume: ${coin.volume}</p>
          <p>⭐ Score: {coin.score}</p>
          <p>⚠ Risk: {coin.risk_flag}</p>

          <p>
            🚨 Signal:{" "}
            <strong
              style={{
                color:
                  coin.signal === "BUY"
                    ? "lime"
                    : coin.signal === "WATCH"
                    ? "yellow"
                    : "red"
              }}
            >
              {coin.signal}
            </strong>
          </p>

          <p>🧠 Accumulation: {coin.accumulation ? "YES" : "NO"}</p>
        </div>
      ))}
    </main>
  );
}