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
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-ok pl-4 pr-4 text-white shadow-[0_14px_40px_-12px_rgba(19,184,106,0.7)] lg:bottom-8 lg:right-8"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-ok/30 [animation-duration:2.6s]" />
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-500 ease-lux group-hover:max-w-[160px] lg:inline">
        ¿Te ayudamos?
      </span>
    </motion.a>
  );
}
