"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Switch, Textarea } from "@/components/ui/Field";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { SingleImageUpload } from "./ImageUploader";
import { useToast } from "./Toast";
import { saveSettings } from "@/lib/actions/admin";
import { settingsSchema, type SettingsFormInput, type SettingsFormValues } from "@/lib/validations";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/constants";
import type { StoreSettings } from "@/lib/types";
import { normalizeParaguayPhone, prettyPhone } from "@/lib/utils";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-maleja-pastel/40 sm:p-6">
      <h2 className="font-serif text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  const pm = DEFAULT_PAYMENT_METHODS.map((d) => {
    const found = settings.payment_methods?.find((p) => p.id === d.id);
    return { ...d, ...found, details: found?.details ?? "" };
  });

  const {
    register,
    control,
    handleSubmit,
    getValues,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      business_name: settings.business_name,
      slogan: settings.slogan,
      logo_url: settings.logo_url ?? "",
      hero_image_url: settings.hero_image_url ?? "",
      hero_title: settings.hero_title ?? "",
      hero_subtitle: settings.hero_subtitle ?? "",
      whatsapp_number: settings.whatsapp_number ?? "",
      instagram_url: settings.instagram_url ?? "",
      facebook_url: settings.facebook_url ?? "",
      tiktok_url: settings.tiktok_url ?? "",
      address: settings.address ?? "",
      business_hours: settings.business_hours ?? "",
      delivery_info: settings.delivery_info ?? "",
      payment_methods: pm,
    },
  });
  const { fields } = useFieldArray({ control, name: "payment_methods" });
  const wa = watch("whatsapp_number");
  const waNormalized = wa ? normalizeParaguayPhone(wa) : null;

  const onSubmit = () =>
    start(async () => {
      const r = await saveSettings(getValues());
      if (!r.ok) {
        if (r.fieldErrors) Object.entries(r.fieldErrors).forEach(([k, v]) => v?.[0] && setError(k as keyof SettingsFormInput, { message: v[0] }));
        return toast("error", r.error);
      }
      toast("success", r.message ?? "Guardado");
      router.refresh();
    });

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast("error", "Revisá los campos marcados."))} noValidate className="space-y-5">
      <Section title="WhatsApp de la tienda" description="Es el número que recibe los pedidos. Sin este dato, la tienda no puede enviar pedidos.">
        {!settings.whatsapp_number && (
          <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Configuración pendiente:</strong> los pedidos online están deshabilitados hasta que cargues el número.
            </span>
          </div>
        )}
        <Field
          label="Número de WhatsApp"
          htmlFor="wa"
          hint="Con código de país, sin espacios ni «+». Ej.: 595981123456 (también acepta 0981 123 456)."
          error={errors.whatsapp_number?.message}
        >
          <div className="relative">
            <WhatsAppIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ok" />
            <Input id="wa" type="tel" inputMode="tel" placeholder="595981123456" className="pl-11" invalid={!!errors.whatsapp_number} {...register("whatsapp_number")} />
          </div>
        </Field>
        {waNormalized && (
          <p className="flex items-center gap-2 text-sm text-ok">
            <CheckCircle2 className="size-4" /> Se usará: {prettyPhone(waNormalized)} ·{" "}
            <a href={`https://wa.me/${waNormalized}`} target="_blank" rel="noopener noreferrer" className="underline">
              probar enlace
            </a>
          </p>
        )}
      </Section>

      <Section title="Identidad">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio" htmlFor="bn" required error={errors.business_name?.message}>
            <Input id="bn" invalid={!!errors.business_name} {...register("business_name")} />
          </Field>
          <Field label="Eslogan" htmlFor="sl" required error={errors.slogan?.message}>
            <Input id="sl" invalid={!!errors.slogan} {...register("slogan")} />
          </Field>
        </div>
        <Field label="Logotipo (opcional)" hint="Si no subís uno, se usa el logotipo tipográfico de la marca.">
          <Controller
            control={control}
            name="logo_url"
            render={({ field }) => <SingleImageUpload value={field.value} onChange={(u) => field.onChange(u ?? "")} folder="logo" aspect="aspect-square" label="Subir logotipo" />}
          />
        </Field>
      </Section>

      <Section title="Portada de la tienda" description="La fotografía principal y los textos del banner de inicio.">
        <Field label="Foto principal" hint="Ideal: vertical 4:5, mínimo 1200 px de ancho.">
          <Controller
            control={control}
            name="hero_image_url"
            render={({ field }) => <SingleImageUpload value={field.value} onChange={(u) => field.onChange(u ?? "")} folder="hero" label="Subir foto" />}
          />
        </Field>
        <Field label="Título (opcional)" htmlFor="ht" hint="Si lo dejás vacío se muestra «Tu estilo, tu esencia.»" error={errors.hero_title?.message}>
          <Input id="ht" {...register("hero_title")} />
        </Field>
        <Field label="Subtítulo (opcional)" htmlFor="hs" error={errors.hero_subtitle?.message}>
          <Textarea id="hs" rows={2} {...register("hero_subtitle")} />
        </Field>
      </Section>

      <Section title="Redes sociales">
        {(
          [
            ["instagram_url", "Instagram", "https://instagram.com/tu_usuario"],
            ["facebook_url", "Facebook", "https://facebook.com/tu_pagina"],
            ["tiktok_url", "TikTok", "https://tiktok.com/@tu_usuario"],
          ] as const
        ).map(([k, label, ph]) => (
          <Field key={k} label={label} htmlFor={k} error={errors[k]?.message}>
            <Input id={k} type="url" inputMode="url" placeholder={ph} invalid={!!errors[k]} {...register(k)} />
          </Field>
        ))}
      </Section>

      <Section title="Atención y entregas">
        <Field label="Dirección" htmlFor="addr" error={errors.address?.message}>
          <Textarea id="addr" rows={2} placeholder="Ej.: Asunción, Paraguay (showroom con cita previa)" {...register("address")} />
        </Field>
        <Field label="Horarios de atención" htmlFor="hours" error={errors.business_hours?.message}>
          <Textarea id="hours" rows={2} placeholder="Ej.: Lunes a sábado de 9:00 a 19:00" {...register("business_hours")} />
        </Field>
        <Field label="Información de entregas" htmlFor="deliv" error={errors.delivery_info?.message}>
          <Textarea id="deliv" rows={4} placeholder="Zonas, costos de delivery, envíos al interior, tiempos estimados…" {...register("delivery_info")} />
        </Field>
      </Section>

      <Section title="Métodos de pago" description="Elegí cuáles se ofrecen en el checkout.">
        {fields.map((f, i) => (
          <div key={f.id} className="rounded-2xl border border-maleja-pastel/50 p-4">
            <Controller
              control={control}
              name={`payment_methods.${i}.enabled`}
              render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label={f.label} description={f.id === "transferencia" ? "La clienta recibe los datos bancarios por WhatsApp." : "Pago al recibir o retirar."} />}
            />
            <input type="hidden" {...register(`payment_methods.${i}.id`)} />
            <input type="hidden" {...register(`payment_methods.${i}.label`)} />
            <Field label="Detalle visible en el checkout (opcional)" className="mt-3">
              <Textarea rows={2} placeholder={f.id === "transferencia" ? "Ej.: Banco, titular y alias se envían por WhatsApp." : "Ej.: Abonás al recibir tu pedido."} {...register(`payment_methods.${i}.details`)} />
            </Field>
          </div>
        ))}
        {errors.payment_methods?.root?.message && <p className="text-xs font-medium text-red-600">{errors.payment_methods.root.message}</p>}
        {errors.payment_methods?.message && <p className="text-xs font-medium text-red-600">{errors.payment_methods.message}</p>}
      </Section>

      <div className="sticky bottom-[calc(66px+env(safe-area-inset-bottom))] z-10 flex justify-end rounded-3xl bg-white/90 p-3 ring-1 ring-maleja-pastel/40 backdrop-blur lg:bottom-4">
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
          {isDirty ? "Guardar cambios" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
