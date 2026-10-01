"use client";

import { useAuthStore } from "@/lib/auth-store";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrganizationSettingsPage() {
  const tenant = useAuthStore((state) => state.tenant);
  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Organización"
        description="Consulta la identidad y configuración base del tenant activo."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del espacio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="organization-name">Nombre</Label>
            <Input
              disabled
              id="organization-name"
              value={tenant?.name ?? ""}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="organization-industry">Industria</Label>
            <Input
              disabled
              id="organization-industry"
              value={tenant?.industry ?? "general"}
              readOnly
            />
          </div>
          <div>
            <Label htmlFor="organization-status">Estado</Label>
            <Input
              disabled
              id="organization-status"
              value={tenant?.status ?? "active"}
              readOnly
            />
          </div>
          <p className="bg-brand-soft text-brand-strong rounded-xl p-3 text-sm leading-6 sm:col-span-2">
            El aislamiento y la seguridad del tenant se resuelven en Laravel.
            Esta interfaz solo usa el tenant activo para branding, preferencias
            y navegación.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
