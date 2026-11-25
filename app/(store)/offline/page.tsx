import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Sin conexión", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="container-lux flex flex-col items-center py-24 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-white text-maleja shadow-card">
        <WifiOff className="h-8 w-8" strokeWidth={1.5} />
      </span>
      <h1 className="heading-lg mt-8">Sin conexión</h1>
      <p className="mt-3 max-w-sm text-ink-soft">Revisá tu conexión a internet y volvé a intentarlo. Tu bolsa se guardó en este dispositivo.</p>
    </div>
  );
}
