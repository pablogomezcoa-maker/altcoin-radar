export const revalidate = 30;

export default async function Home() {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1",
    {
      next: { revalidate: 30 }
    }
  );

  const coins = await response.json();

  const topCoins = coins.slice(0, 3);

  const totalCoins = coins.length;

  const avgChange =
    coins.reduce(
      (acc: number, coin: any) =>
        acc + (coin.price_change_percentage_24h || 0),
      0
    ) / totalCoins;

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
        <p>📈 Avg Market Change: {avgChange.toFixed(2)}%</p>
        <p>🔄 Auto refresh: every 30s</p>
      </div>

      <h2>🏆 Top Movers</h2>

      {topCoins.map((coin: any, index: number) => (
        <div
          key={coin.id}
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

          <p>💲 Price: ${coin.current_price}</p>
          <p>
            📈 Change:{" "}
            {(coin.price_change_percentage_24h || 0).toFixed(2)}%
          </p>
          <p>🏅 Rank: {coin.market_cap_rank}</p>
        </div>
      ))}

      <h2 style={{ marginTop: "40px" }}>📊 Full Market</h2>

      {coins.map((coin: any, index: number) => (
        <div
          key={coin.id}
          style={{
            border: "2px solid #4ade80",
            backgroundColor: "#1c2a44",
            padding: "20px",
            marginBottom: "15px",
            borderRadius: "15px"
          }}
        >
          <h3>
            #{index + 1} {coin.name} ({coin.symbol.toUpperCase()})
          </h3>

          <p>💲 Price: ${coin.current_price}</p>
          <p>
            📈 24h Change:{" "}
            {(coin.price_change_percentage_24h || 0).toFixed(2)}%
          </p>
          <p>🏅 Rank: {coin.market_cap_rank}</p>
          <p>💰 Market Cap: ${coin.market_cap}</p>
          <p>💧 Volume: ${coin.total_volume}</p>
        </div>
      ))}
    </main>
  );
}