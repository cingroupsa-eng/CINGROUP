"use client";

import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { useStore } from "./StoreContext";
import { waLink } from "@/lib/utils";

/** Botón flotante — sólo se muestra si la tienda configuró su WhatsApp. */
export function WhatsAppFloat() {
  const { settings } = useStore();
  if (!settings.whatsapp_number) return null;
  return (
    <motion.a
      href={waLink(settings.whatsapp_number, "¡Hola! Vengo de la tienda online y quisiera hacer una consulta 💕")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      // Nunca desde scale(0): entra desde 0.8 + opacidad.
      initial={{ opacity: 0, transform: "scale(0.8)" }}
      animate={{ opacity: 1, transform: "scale(1)" }}
      transition={{ delay: 1, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-float flex h-14 items-center gap-2 rounded-full bg-ok px-4 text-white shadow-lg transition-[transform,filter] duration-press ease-lux hover:brightness-110 active:scale-[0.95] lg:bottom-8 lg:right-8"
    >
      {/* Pulso de atención: sólo 3 veces, no en bucle infinito. */}
      <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-full bg-ok/30 [animation-duration:2.4s] [animation-iteration-count:3]" />
      <WhatsAppIcon className="size-6" />
      <span className="hidden text-sm font-medium lg:inline">¿Te ayudamos?</span>
    </motion.a>
  );
}
