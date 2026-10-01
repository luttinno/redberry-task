import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "../../api/client";

export function mapApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, Path<T>>,
): string {
  if (error instanceof ApiError && error.errors) {
    let mapped = false;
    for (const [apiField, messages] of Object.entries(error.errors)) {
      const field = fieldMap[apiField];
      const message = messages[0];
      if (field && message) {
        setError(field, { type: "server", message });
        mapped = true;
      }
    }
    if (mapped) return "";
  }
  return error instanceof Error
    ? error.message
    : "Unable to complete the request.";
}
