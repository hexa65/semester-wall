export type ToastVariant = "success" | "error";

export interface ToastState {
  message: string;
  variant: ToastVariant;
}
