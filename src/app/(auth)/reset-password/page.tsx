"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components/auth-card";
import { authApi } from "@/features/auth/api";
import { applyServerErrors } from "@/features/auth/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";

const schema = z
  .object({
    email: z.string().email("Escribe un correo válido."),
    token: z.string().min(1, "Pega el token del enlace."),
    password: z.string().min(8, "Usa al menos 8 caracteres."),
    password_confirmation: z.string().min(1, "Repite tu contraseña."),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Las contraseñas no coinciden.",
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.resetPassword(values);
      setDone(true);
      window.setTimeout(() => router.replace("/login"), 1200);
    } catch (error) {
      applyServerErrors(error, setError);
    }
  };
  return (
    <AuthCard
      title="Define una nueva contraseña"
      description="Usa el token que recibiste por correo para continuar."
    >
      {done ? (
        <div className="text-success rounded-2xl bg-emerald-50 p-5 text-sm leading-6">
          Tu contraseña fue actualizada. Redirigiendo al inicio de sesión…
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="token">Token de recuperación</Label>
            <Input id="token" {...register("token")} />
            <FieldError message={errors.token?.message} />
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
            <Label htmlFor="password_confirmation">Repite la contraseña</Label>
            <Input
              autoComplete="new-password"
              id="password_confirmation"
              type="password"
              {...register("password_confirmation")}
            />
            <FieldError message={errors.password_confirmation?.message} />
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
        </form>
      )}
      <p className="text-muted mt-6 text-center text-sm">
        <Link
          className="text-brand hover:text-brand-strong font-bold"
          href="/login"
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthCard>
  );
}
