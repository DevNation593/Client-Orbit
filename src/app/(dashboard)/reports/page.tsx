"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inteligencia"
        title="Reportes"
        description="Un espacio preparado para widgets configurables y métricas por industria."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversión por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-border flex h-48 items-end gap-5 border-b border-l px-6">
              {[82, 63, 48, 31, 18].map((height, index) => (
                <div
                  className="flex flex-1 flex-col items-center justify-end gap-2"
                  key={index}
                >
                  <span className="text-brand text-xs font-bold">
                    {height}%
                  </span>
                  <div
                    className="bg-brand/80 w-full rounded-t-xl"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="text-muted mt-4 flex justify-between text-xs">
              <span>Nuevo</span>
              <span>Contacto</span>
              <span>Propuesta</span>
              <span>Negociación</span>
              <span>Ganado</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Widgets configurables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Rendimiento de ventas", icon: TrendingUp },
              { label: "Actividad del equipo", icon: BarChart3 },
            ].map(({ label, icon: Icon }) => (
              <div
                className="border-border flex items-center gap-3 rounded-xl border p-4"
                key={label}
              >
                <span className="bg-brand-soft text-brand flex h-9 w-9 items-center justify-center rounded-xl">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted mt-0.5 text-xs">
                    Listo para conectar a métricas del backend.
                  </p>
                </div>
              </div>
            ))}
            <p className="bg-surface-subtle text-muted rounded-xl p-3 text-xs leading-5">
              No se ha inventado un endpoint de analítica: los widgets muestran
              la arquitectura visual hasta que el contrato de reportes sea
              publicado por la API.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
