import type { FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/error";

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  if (!(error instanceof ApiError)) return;
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    setError(field as Parameters<typeof setError>[0], {
      type: "server",
      message: messages[0] ?? error.message,
    });
  }
}
