"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthCard } from "@/features/auth/components/auth-card";
import { authApi } from "@/features/auth/api";
import { applyServerErrors } from "@/features/auth/utils";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api/error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/common/field-error";

const schema = z.object({
  email: z.string().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const onSubmit = async (values: FormValues) => {
    try {
      const session = await authApi.login({
        ...values,
        device_name: "vantex-web",
      });
      setSession(session);
      router.replace("/");
    } catch (error) {
      applyServerErrors(error, setError);
      if (
        error instanceof ApiError &&
        Object.keys(error.fieldErrors).length === 0
      )
        setError("root", { message: error.message });
    }
  };
  return (
    <AuthCard
      title="Bienvenido de nuevo"
      description="Accede a tu espacio de trabajo para continuar."
    >
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
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              className="text-brand hover:text-brand-strong text-xs font-semibold"
              href="/forgot-password"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <Input
            autoComplete="current-password"
            id="password"
            placeholder="••••••••"
            type="password"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        {errors.root?.message ? (
          <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
            {errors.root.message}
          </p>
        ) : null}
        <Button className="mt-2 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>
      </form>
      <p className="text-muted mt-6 text-center text-sm">
        ¿Aún no tienes una cuenta?{" "}
        <Link
          className="text-brand hover:text-brand-strong font-bold"
          href="/register"
        >
          Crea tu espacio
        </Link>
      </p>
    </AuthCard>
  );
}
