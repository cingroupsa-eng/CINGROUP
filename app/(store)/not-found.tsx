import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-lux flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="heading-lg mt-4">
        Esta página se fue <span className="italic text-maleja-deep">de compras</span>
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">No encontramos lo que buscabas. Puede que la prenda ya no esté disponible.</p>
      <Link href="/tienda" className={buttonStyles("primary", "lg", "mt-8")}>
        Ir a la tienda
      </Link>
    </div>
  );
}
