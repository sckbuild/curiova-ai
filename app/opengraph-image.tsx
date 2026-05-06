import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Curiova.ai — Where Curious Minds Level Up";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0F0E17",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "#FF6B6B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            C
          </div>
          <span style={{ fontSize: 60, fontWeight: 700, color: "#FFFCF2" }}>
            Curiova.ai
          </span>
        </div>
        <p
          style={{
            fontSize: 32,
            color: "#A0A0B0",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Where Curious Minds Level Up
        </p>
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {["CBSE", "ICSE", "US K-12", "IB"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                borderRadius: 100,
                border: "2px solid #FF6B6B",
                color: "#FF6B6B",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
