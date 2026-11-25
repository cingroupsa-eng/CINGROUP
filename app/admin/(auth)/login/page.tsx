import type { Metadata } from "next";
import { Suspense } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Isotype, Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-maleja-canvas px-4 py-10">
      <div aria-hidden className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-maleja-pastel/50 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -right-24 h-[420px] w-[420px] rounded-full bg-maleja-hot/15 blur-3xl" />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-5">
          <Isotype className="h-16 w-16 drop-shadow-[0_14px_30px_rgba(240,0,114,0.35)]" />
          <Logo size="md" />
        </div>
        <div className="card-lux p-6 sm:p-8">
          <h1 className="font-serif text-3xl text-ink">Panel de gestión</h1>
          <p className="mt-1 text-sm text-ink-soft">Ingresá con tu correo y contraseña de administradora.</p>
          {isSupabaseConfigured ? (
            <Suspense>
              <LoginForm />
            </Suspense>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Configuración pendiente</p>
              <p className="mt-1">
                La tienda todavía no está conectada a Supabase. Completá las variables <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> siguiendo el archivo <strong>README_CONFIGURACION.md</strong>.
              </p>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-ink-soft">
          <a href="/" className="hover:text-maleja">
            ← Volver a la tienda
          </a>
        </p>
      </div>
    </div>
  );
}
