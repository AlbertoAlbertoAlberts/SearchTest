import { useState } from "react";

export default function Home() {
  const [q, setQ] = useState("Fender Jazz Bass");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  async function runSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setItems([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>SS.com search test</h1>

      <form onSubmit={runSearch} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          style={{ flex: 1, padding: 12, fontSize: 16 }}
        />
        <button style={{ padding: "12px 16px", fontSize: 16 }}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <p style={{ color: "crimson", marginTop: 16 }}>
          Error: {error}
        </p>
      )}

      <div style={{ marginTop: 24 }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>{it.title || "(no title)"}</div>
            <div style={{ opacity: 0.8 }}>{it.price || ""}</div>
            {it.link && (
              <a href={it.link} target="_blank" rel="noreferrer">
                Open listing
              </a>
            )}
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
              Source: {it.source || "ss.com"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}