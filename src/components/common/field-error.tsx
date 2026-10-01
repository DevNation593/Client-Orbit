export function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-danger mt-1.5 text-xs font-medium">{message}</p>
  ) : null;
}
