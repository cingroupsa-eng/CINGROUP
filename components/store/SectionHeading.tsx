import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "Ver todo",
}: {
  eyebrow: string;
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="heading-lg mt-2 text-ink">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-2 text-sm font-medium text-ink sm:inline-flex">
          <span className="link-underline">{linkLabel}</span>
          <ArrowRight className="size-4 transition-transform duration-300 ease-lux group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
