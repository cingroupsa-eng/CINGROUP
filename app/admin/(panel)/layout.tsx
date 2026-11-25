import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getAdminContext } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { Isotype } from "@/components/brand/Logo";
import { signOut } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");

  if (!ctx.isAdmin) {
    return (
      <div className="grid min-h-dvh place-items-center bg-maleja-canvas px-6">
        <div className="card-lux max-w-md p-8 text-center">
          <Isotype className="mx-auto h-14 w-14" />
          <ShieldAlert className="mx-auto mt-6 h-8 w-8 text-maleja" />
          <h1 className="mt-4 font-serif text-3xl">Acceso restringido</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Tu usuario (<strong>{ctx.user.email}</strong>) inició sesión pero todavía no tiene rol de administrador. Pedí a la
            persona responsable que te asigne el rol <code className="rounded bg-maleja-canvas px-1">admin</code> desde Supabase
            (ver README_CONFIGURACION.md, paso 4).
          </p>
          <form action={signOut} className="mt-6">
            <button className="min-h-[44px] rounded-full bg-ink px-6 text-sm font-medium text-white">Cerrar sesión</button>
          </form>
        </div>
      </div>
    );
  }

  const { count } = await ctx.supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pendiente");

  return (
    <AdminShell userName={ctx.profile?.full_name || ctx.user.email || ""} pendingCount={count ?? 0}>
      {children}
    </AdminShell>
  );
}
