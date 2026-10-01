import type { ApiErrorPayload } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  static fromPayload(payload: unknown, status: number) {
    const data = (payload ?? {}) as Partial<ApiErrorPayload>;
    return new ApiError(
      data.message ?? "No se pudo completar la solicitud.",
      status,
      data.errors ?? {},
    );
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}
