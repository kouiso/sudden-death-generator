export interface ToastProps {
  status: "success" | "error";
  message: string;
}

export function Toast({ status, message }: ToastProps) {
  return (
    <div className={`toast ${status === "error" ? "toast--error" : ""}`} role="status" aria-live="polite">
      <span aria-hidden="true">{status === "error" ? "⚠️" : "✅"}</span>
      <span>{message}</span>
    </div>
  );
}
