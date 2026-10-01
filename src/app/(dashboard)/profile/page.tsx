"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authApi } from "@/features/auth/api";
import { applyServerErrors } from "@/features/auth/utils";
import { useAuthStore } from "@/lib/auth-store";
import { PageHeader } from "@/components/common/page-header";
import { Avatar } from "@/components/common/avatar";
import { FieldError } from "@/components/common/field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    current_password: z.string().min(1, "Escribe tu contraseña actual."),
    password: z.string().min(8, "Usa al menos 8 caracteres."),
    password_confirmation: z.string().min(1, "Repite tu contraseña."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Las contraseñas no coinciden.",
  });
type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.updatePassword(values);
      reset();
      setDone(true);
    } catch (error) {
      applyServerErrors(error, setError);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Cuenta"
        title="Mi perfil"
        description="Gestiona tu información personal y las credenciales de acceso."
      />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardContent className="flex flex-col items-center p-7 text-center">
            <Avatar name={user?.name} size="lg" />
            <h2 className="mt-4 text-lg font-bold">{user?.name}</h2>
            <p className="text-muted mt-1 text-sm">{user?.email}</p>
            <p className="bg-brand-soft text-brand-strong mt-5 rounded-full px-3 py-1 text-xs font-bold">
              Administrador del espacio
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            >
              <div>
                <Label htmlFor="current_password">Contraseña actual</Label>
                <Input
                  autoComplete="current-password"
                  id="current_password"
                  type="password"
                  {...register("current_password")}
                />
                <FieldError message={errors.current_password?.message} />
              </div>
              <div>
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  autoComplete="new-password"
                  id="password"
                  type="password"
                  {...register("password")}
                />
                <FieldError message={errors.password?.message} />
              </div>
              <div>
                <Label htmlFor="password_confirmation">
                  Repite la nueva contraseña
                </Label>
                <Input
                  autoComplete="new-password"
                  id="password_confirmation"
                  type="password"
                  {...register("password_confirmation")}
                />
                <FieldError message={errors.password_confirmation?.message} />
              </div>
              {done ? (
                <p className="text-success rounded-xl bg-emerald-50 p-3 text-sm">
                  Contraseña actualizada correctamente.
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Actualizando…" : "Actualizar contraseña"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
