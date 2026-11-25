import { ImageResponse } from "next/og";

export const alt = "EL BAZAR DE MALEJA — Tu estilo, tu esencia.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFF7FA 0%, #FFFFFF 45%, #FFB6D0 100%)",
          color: "#211820",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 38,
            background: "linear-gradient(135deg, #FF4F9A, #F00072)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 92,
            fontStyle: "italic",
          }}
        >
          M
        </div>
        <div style={{ marginTop: 40, fontSize: 26, letterSpacing: 12, color: "#8B7480", fontFamily: "sans-serif" }}>EL BAZAR DE</div>
        <div style={{ fontSize: 120, fontStyle: "italic", lineHeight: 1 }}>Maleja</div>
        <div style={{ marginTop: 28, fontSize: 40, color: "#F00072", fontStyle: "italic" }}>Tu estilo, tu esencia.</div>
      </div>
    ),
    size
  );
}
