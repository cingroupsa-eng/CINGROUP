import Link from "next/link";
import { Clock, CreditCard, MapPin, Truck } from "lucide-react";
import type { Category, StoreSettings } from "@/lib/types";
import { Logo } from "@/components/brand/Logo";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { isSafeHttpUrl, prettyPhone, waLink } from "@/lib/utils";

function Pending() {
  return <span className="italic text-white/40">Configuración pendiente</span>;
}

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const socials = [
    { url: settings.instagram_url, Icon: InstagramIcon, label: "Instagram" },
    { url: settings.facebook_url, Icon: FacebookIcon, label: "Facebook" },
    { url: settings.tiktok_url, Icon: TikTokIcon, label: "TikTok" },
  ];
  const payments = settings.payment_methods.filter((p) => p.enabled);

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink pb-[calc(88px+env(safe-area-inset-bottom))] text-white/80 lg:pb-0">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-maleja/20 blur-3xl" />
      <div className="container-lux relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Logo tone="light" size="md" className="!items-start" />
          <p className="mt-5 max-w-xs font-serif text-2xl italic leading-snug text-white">{settings.slogan}</p>
          <div className="mt-6 flex gap-2">
            {socials.map(({ url, Icon, label }) =>
              isSafeHttpUrl(url) ? (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-maleja hover:bg-maleja"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ) : (
                <span
                  key={label}
                  title={`${label}: configuración pendiente`}
                  className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-white/15 text-white/25"
                >
                  <Icon className="h-5 w-5" />
                </span>
              )
            )}
          </div>
        </div>

        <div>
          <h3 className="eyebrow !text-maleja-pastel">Categorías</h3>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-1">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/categoria/${c.slug}`} className="link-underline inline-block py-1 hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow !text-maleja-pastel">Atención</h3>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3">
              <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
              {settings.whatsapp_number ? (
                <a href={waLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {prettyPhone(settings.whatsapp_number)}
                </a>
              ) : (
                <Pending />
              )}
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-maleja-pastel" />
              <span className="whitespace-pre-line">{settings.business_hours || <Pending />}</span>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-maleja-pastel" />
              <span className="whitespace-pre-line">{settings.address || <Pending />}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow !text-maleja-pastel">Entregas y pagos</h3>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-maleja-pastel" />
              <span className="whitespace-pre-line">{settings.delivery_info || <Pending />}</span>
            </li>
            <li className="flex gap-3">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-maleja-pastel" />
              <span>{payments.length ? payments.map((p) => p.label).join(" · ") : <Pending />}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-lux flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.business_name}. Todos los derechos reservados.
          </p>
          <p>Hecho con amor en Paraguay 🇵🇾</p>
        </div>
      </div>
    </footer>
  );
}
