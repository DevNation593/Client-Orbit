"use client";

import Link from "next/link";
import { useState } from "react";
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

const schema = z.object({
  email: z.string().email("Escribe un correo válido."),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    try {
      await authApi.forgotPassword(values);
      setSent(true);
    } catch (error) {
      applyServerErrors(error, setError);
    }
  };
  return (
    <AuthCard
      title="Recupera tu acceso"
      description="Te enviaremos instrucciones para restablecer tu contraseña."
    >
      {sent ? (
        <div className="text-success rounded-2xl bg-emerald-50 p-5 text-sm leading-6">
          Si existe una cuenta con ese correo, recibirás un enlace de
          recuperación. Revisa también tu carpeta de spam.
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        >
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              autoComplete="email"
              id="email"
              placeholder="tu@empresa.com"
              type="email"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Enviando…" : "Enviar instrucciones"}
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
