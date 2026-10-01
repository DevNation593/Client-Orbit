"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authApi } from "@/features/auth/api";
import { applyServerErrors } from "@/features/auth/utils";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api/error";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ErrorState, ListSkeleton } from "@/components/common/async-state";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/common/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().optional(),
  password: z.string().min(8, "Usa al menos 8 caracteres."),
  password_confirmation: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const invitation = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => authApi.invitation(token),
    enabled: /^[A-Za-z0-9]{64}$/.test(token),
    retry: false,
  });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", password: "", password_confirmation: "" },
  });

  if (invitation.isLoading) return <ListSkeleton rows={3} />;
  if (invitation.isError || !invitation.data) {
    return (
      <ErrorState
        title="Invitación no disponible"
        description="El enlace no existe, ya fue utilizado o ha vencido."
        onRetry={() => void invitation.refetch()}
      />
    );
  }

  const details = invitation.data;
  const submit = async (values: FormValues) => {
    if (!details.existing_user && (values.name?.trim().length ?? 0) < 2) {
      setError("name", { message: "Escribe tu nombre." });
      return;
    }
    if (
      !details.existing_user &&
      values.password !== values.password_confirmation
    ) {
      setError("password_confirmation", {
        message: "Las contraseñas no coinciden.",
      });
      return;
    }
    try {
      const body = details.existing_user
        ? { password: values.password }
        : {
            name: values.name,
            password: values.password,
            password_confirmation: values.password_confirmation,
          };
      const session = await authApi.acceptInvitation(token, body);
      setSession(session);
      router.replace("/");
    } catch (error) {
      applyServerErrors(error, setError);
      if (
        error instanceof ApiError &&
        Object.keys(error.fieldErrors).length === 0
      ) {
        setError("root", { message: error.message });
      }
    }
  };

  return (
    <AuthCard
      title={`Únete a ${details.tenant.name}`}
      description={`Te invitaron como ${details.role.name} con el correo ${details.email}.`}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => void handleSubmit(submit)(event)}
      >
        {!details.existing_user ? (
          <>
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                <FieldError message={errors.password?.message} />
              </div>
              <div>
                <Label htmlFor="password_confirmation">
                  Repite la contraseña
                </Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  {...register("password_confirmation")}
                />
                <FieldError message={errors.password_confirmation?.message} />
              </div>
            </div>
          </>
        ) : (
          <div>
            <p className="bg-brand-soft text-brand-strong mb-4 rounded-xl p-3 text-sm">
              Tu cuenta ya existe. Confirma tu contraseña para añadir este
              espacio a tus organizaciones.
            </p>
            <Label htmlFor="password">Contraseña actual</Label>
            <Input
              autoComplete="current-password"
              id="password"
              type="password"
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>
        )}
        {errors.root?.message ? (
          <p className="text-danger rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium">
            {errors.root.message}
          </p>
        ) : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Aceptando…" : "Aceptar invitación"}
        </Button>
      </form>
    </AuthCard>
  );
}
