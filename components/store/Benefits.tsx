import { Gem, MessageCircleHeart, Truck, Wallet } from "lucide-react";
import { Reveal } from "./Reveal";

const items = [
  { Icon: MessageCircleHeart, title: "Atención personalizada", text: "Te asesoramos por WhatsApp con talles, colores y combinaciones." },
  { Icon: Truck, title: "Envíos a todo Paraguay", text: "Coordinamos la entrega para que tu pedido llegue a donde estés." },
  { Icon: Wallet, title: "Transferencia o efectivo", text: "Pagá de la forma que te resulte más cómoda, sin complicaciones." },
  { Icon: Gem, title: "Prendas seleccionadas", text: "Cada pieza es elegida a mano pensando en calidad y estilo." },
];

export function Benefits() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {items.map(({ Icon, title, text }, i) => (
        <Reveal key={title} delay={i * 0.07}>
          <div className="group flex h-full gap-4 rounded-3xl border border-maleja-pastel/40 bg-white p-5 transition-all duration-500 ease-lux hover:-translate-y-1 hover:shadow-soft lg:flex-col lg:p-7">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-maleja-canvas text-maleja transition-colors duration-300 group-hover:bg-maleja group-hover:text-white">
              <Icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <div>
              <h3 className="font-serif text-xl text-ink">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
