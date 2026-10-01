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

const schema = z
  .object({
    name: z.string().min(2, "Escribe tu nombre."),
    email: z.string().email("Escribe un correo válido."),
    password: z.string().min(8, "Usa al menos 8 caracteres."),
    password_confirmation: z.string(),
    tenant_name: z.string().min(2, "Escribe el nombre de tu organización."),
    industry: z.string().optional(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Las contraseñas no coinciden.",
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      tenant_name: "",
      industry: "general",
    },
  });
  const onSubmit = async (values: FormValues) => {
    try {
      const session = await authApi.register({
        ...values,
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
      title="Crea tu espacio"
      description="Configura una organización y empieza a trabajar en minutos."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Tu nombre</Label>
            <Input
              autoComplete="name"
              id="name"
              placeholder="Ana García"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              autoComplete="email"
              id="email"
              placeholder="ana@empresa.com"
              type="email"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>
        <div>
          <Label htmlFor="tenant_name">Nombre de la organización</Label>
          <Input
            id="tenant_name"
            placeholder="Acme Studio"
            {...register("tenant_name")}
          />
          <FieldError message={errors.tenant_name?.message} />
        </div>
        <div>
          <Label htmlFor="industry">Industria</Label>
          <Input
            id="industry"
            placeholder="general"
            {...register("industry")}
          />
          <FieldError message={errors.industry?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              autoComplete="new-password"
              id="password"
              placeholder="Mínimo 8 caracteres"
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
              placeholder="••••••••"
              type="password"
              {...register("password_confirmation")}
            />
            <FieldError message={errors.password_confirmation?.message} />
          </div>
        </div>
        {errors.root?.message ? (
          <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
            {errors.root.message}
          </p>
        ) : null}
        <Button className="mt-2 w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creando espacio…" : "Crear mi espacio"}
        </Button>
      </form>
      <p className="text-muted mt-6 text-center text-sm">
        ¿Ya tienes una cuenta?{" "}
        <Link
          className="text-brand hover:text-brand-strong font-bold"
          href="/login"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
