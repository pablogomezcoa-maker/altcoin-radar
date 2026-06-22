export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const BACKEND_URL =
  "https://altcoin-radar-ubo5.onrender.com/coins";

type Coin = {
  name?: string;
  symbol?: string;
  category?: string;
  signal?: string;
  price?: number | null;
  rank?: number | null;
  market_cap?: number | null;
  fdv?: number | null;
  fdv_ratio?: number | null;
  change_24h?: number | null;
  volume?: number | null;
  accumulation?: boolean;
  risk_flag?: string;
  score?: number | null;
};

type CoinsResult = {
  coins: Coin[];
  error: string | null;
};

function formatPrice(value: unknown): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/D";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: number < 1 ? 4 : 2,
    maximumFractionDigits: number < 1 ? 8 : 2,
  }).format(number);
}

function formatLargeMoney(value: unknown): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/D";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercentage(value: unknown): string {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/D";
  }

  return `${number.toFixed(2)}%`;
}

function getSignalColor(signal?: string): string {
  switch (signal?.toUpperCase()) {
    case "BUY":
      return "#22c55e";

    case "AVOID":
      return "#ef4444";

    default:
      return "#f59e0b";
  }
}

function getRiskColor(risk?: string): string {
  switch (risk?.toUpperCase()) {
    case "LOW":
      return "#22c55e";

    case "HIGH":
      return "#ef4444";

    default:
      return "#f59e0b";
  }
}

async function getCoins(): Promise<CoinsResult> {
  try {
    const response = await fetch(BACKEND_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const responseText = await response.text();

      return {
        coins: [],
        error:
          `El backend respondió con el error ${response.status}. ` +
          responseText.slice(0, 250),
      };
    }

    const data: unknown = await response.json();

    if (Array.isArray(data)) {
      return {
        coins: data as Coin[],
        error: null,
      };
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "coins" in data
    ) {
      const coinsProperty = (
        data as {
          coins?: unknown;
        }
      ).coins;

      if (Array.isArray(coinsProperty)) {
        return {
          coins: coinsProperty as Coin[],
          error: null,
        };
      }
    }

    return {
      coins: [],
      error:
        "El backend respondió, pero los datos no tienen el formato esperado.",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido al consultar el backend.";

    return {
      coins: [],
      error: `No fue posible conectarse con el backend: ${message}`,
    };
  }
}

export default async function Home() {
  const { coins, error } = await getCoins();

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #07111f 0%, #0f172a 55%, #111827 100%)",
        color: "#f8fafc",
        padding: "40px 20px 70px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            marginBottom: "32px",
          }}
        >
          <p
            style={{
              color: "#38bdf8",
              fontWeight: 700,
              letterSpacing: "2px",
              marginBottom: "8px",
            }}
          >
            CRYPTO MARKET SCANNER
          </p>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              margin: 0,
            }}
          >
            Altcoin Radar Live
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "1.05rem",
              marginTop: "12px",
            }}
          >
            Monedas encontradas:{" "}
            <strong style={{ color: "#ffffff" }}>
              {coins.length}
            </strong>
          </p>
        </header>

        {error ? (
          <section
            style={{
              background: "rgba(127, 29, 29, 0.35)",
              border: "1px solid #ef4444",
              borderRadius: "14px",
              padding: "22px",
            }}
          >
            <h2
              style={{
                color: "#fca5a5",
                marginTop: 0,
              }}
            >
              No se pudieron cargar las monedas
            </h2>

            <p
              style={{
                lineHeight: 1.6,
                marginBottom: "12px",
              }}
            >
              {error}
            </p>

            <p
              style={{
                color: "#cbd5e1",
                marginBottom: 0,
              }}
            >
              Esto significa que la página de Vercel está
              funcionando, pero el backend de Render no pudo
              entregar los datos correctamente.
            </p>
          </section>
        ) : coins.length === 0 ? (
          <section
            style={{
              background: "rgba(30, 41, 59, 0.8)",
              border: "1px solid #334155",
              borderRadius: "14px",
              padding: "22px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              No hay monedas disponibles
            </h2>

            <p
              style={{
                color: "#cbd5e1",
                marginBottom: 0,
              }}
            >
              El backend respondió correctamente, pero entregó una
              lista vacía.
            </p>
          </section>
        ) : (
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {coins.map((coin, index) => {
              const symbol = String(
                coin.symbol ?? "N/D",
              ).toUpperCase();

              const name = String(
                coin.name ?? "Moneda desconocida",
              );

              const change = Number(coin.change_24h ?? 0);
              const signal = String(coin.signal ?? "WATCH");
              const risk = String(coin.risk_flag ?? "N/D");

              return (
                <article
                  key={`${symbol}-${coin.rank ?? index}`}
                  style={{
                    background: "rgba(15, 23, 42, 0.88)",
                    border: "1px solid #334155",
                    borderRadius: "16px",
                    padding: "22px",
                    boxShadow:
                      "0 12px 30px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "15px",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#64748b",
                          margin: "0 0 5px",
                        }}
                      >
                        Ranking #{coin.rank ?? "N/D"}
                      </p>

                      <h2
                        style={{
                          fontSize: "1.4rem",
                          margin: 0,
                        }}
                      >
                        {name}
                      </h2>

                      <p
                        style={{
                          color: "#38bdf8",
                          fontWeight: 700,
                          margin: "5px 0 0",
                        }}
                      >
                        {symbol}
                      </p>
                    </div>

                    <span
                      style={{
                        background: getSignalColor(signal),
                        color: "#07111f",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                      }}
                    >
                      {signal}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#94a3b8",
                      marginBottom: "5px",
                    }}
                  >
                    Precio
                  </p>

                  <p
                    style={{
                      fontSize: "1.55rem",
                      fontWeight: 800,
                      margin: "0 0 18px",
                    }}
                  >
                    {formatPrice(coin.price)}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      Cambio 24 horas:{" "}
                      <strong
                        style={{
                          color:
                            change >= 0
                              ? "#22c55e"
                              : "#ef4444",
                        }}
                      >
                        {formatPercentage(coin.change_24h)}
                      </strong>
                    </p>

                    <p style={{ margin: 0 }}>
                      Capitalización:{" "}
                      <strong>
                        {formatLargeMoney(coin.market_cap)}
                      </strong>
                    </p>

                    <p style={{ margin: 0 }}>
                      Volumen:{" "}
                      <strong>
                        {formatLargeMoney(coin.volume)}
                      </strong>
                    </p>

                    <p style={{ margin: 0 }}>
                      Categoría:{" "}
                      <strong>
                        {coin.category ?? "OTHER"}
                      </strong>
                    </p>

                    <p style={{ margin: 0 }}>
                      Puntaje:{" "}
                      <strong>{coin.score ?? 0}</strong>
                    </p>

                    <p style={{ margin: 0 }}>
                      Riesgo:{" "}
                      <strong
                        style={{
                          color: getRiskColor(risk),
                        }}
                      >
                        {risk}
                      </strong>
                    </p>

                    <p style={{ margin: 0 }}>
                      Acumulación:{" "}
                      <strong>
                        {coin.accumulation ? "SÍ" : "NO"}
                      </strong>
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}