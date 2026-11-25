import type { Config } from "tailwindcss";

const config: Config = {
  // Hover sólo en dispositivos con puntero real (evita "hover pegado" en táctiles).
  future: { hoverOnlyWhenSupported: true },
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maleja: {
          DEFAULT: "#F00072", // Fucsia principal — CTAs, acentos
          hot: "#FF4F9A", // Rosa intenso — hover, gradientes
          pastel: "#FFB6D0", // Rosa pastel — fondos suaves, bordes
          canvas: "#FFF7FA", // Fondo base
          // Tonos accesibles (AA ≥ 4,5:1) para TEXTO y fondos con texto blanco.
          // El fucsia de marca #F00072 se mantiene para acentos, íconos y bordes.
          deep: "#D60065",
          dark: "#C8005E", // hover de botones con texto
        },
        ink: {
          DEFAULT: "#211820", // Texto principal
          // Texto secundario: #8B7480 ajustado a #806B76 para cumplir AA (4,66:1 sobre el fondo base).
          soft: "#806B76",
        },
        ok: {
          DEFAULT: "#13B86A", // Confirmación: íconos, puntos de estado
          deep: "#0C7D48", // Texto verde y botones con texto blanco (AA)
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        // ease-out fuerte para entradas y feedback de UI
        lux: "cubic-bezier(0.23, 1, 0.32, 1)",
        // curva tipo iOS para paneles y drawers
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: { DEFAULT: "200ms", press: "160ms" },
      // Escala fija de capas (sin z-index arbitrarios)
      zIndex: {
        float: "30",
        header: "40",
        overlay: "60",
        search: "70",
        lightbox: "80",
        toast: "90",
        skip: "100",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(240, 0, 114, 0.14)",
        card: "0 2px 20px -6px rgba(33, 24, 32, 0.08)",
        lift: "0 24px 60px -20px rgba(240, 0, 114, 0.28)",
      },
      letterSpacing: { luxe: "0.28em" },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        floaty: "floaty 6s ease-in-out infinite",
        "spin-slow": "spin-slow 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
