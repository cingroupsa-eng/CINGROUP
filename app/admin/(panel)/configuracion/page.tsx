import type { Metadata } from "next";
import { getAdminContext } from "@/lib/auth";
import { PageHeader } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { StoreSettings } from "@/lib/types";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const ctx = (await getAdminContext())!;
  const { data } = await ctx.supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  const settings = { ...DEFAULT_SETTINGS, ...(data ?? {}) } as StoreSettings;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Configuración" description="Datos del negocio que se muestran en la tienda." />
      <SettingsForm key={settings.updated_at ?? "s"} settings={settings} />
    </div>
  );
}
