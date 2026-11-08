import { ToastItem } from '@/components/ui/toast/toast-item';
import type { ToastRecord } from '@/components/ui/toast/toast-provider';

type ToastContainerProps = {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-end gap-3 p-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:left-auto sm:max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}
