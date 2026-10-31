import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";

export interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "charcoal" | "orange";
  onConfirm: () => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
}

/**
 * ConfirmDialog Component
 * Telemetry-styled modal confirmation dialog for sensitive actions (e.g. reminders, status changes).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  variant = "charcoal",
  onConfirm,
  onCancel,
  trigger,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#2B302B]/40 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal Window */}
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-6 shadow-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-[2px] flex items-center justify-center text-white shrink-0",
                  variant === "orange" ? "bg-[#F57B4A]" : "bg-[#2B302B]"
                )}
              >
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A968A]">
                  SYSTEM_VERIFICATION //
                </span>
                <DialogPrimitive.Title className="text-base font-extrabold uppercase tracking-tight text-[#2B302B]">
                  {title}
                </DialogPrimitive.Title>
              </div>
            </div>

            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="text-[#8A968A] hover:text-[#2B302B] p-1 rounded-[2px] hover:bg-[#D3E3D3]/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Description */}
          <DialogPrimitive.Description className="text-xs text-[#8A968A] leading-relaxed mb-6">
            {description}
          </DialogPrimitive.Description>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#B9CBB9]">
            <DialogPrimitive.Close asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant={variant === "orange" ? "orange" : "default"}
              size="sm"
              onClick={() => {
                onConfirm();
                if (onOpenChange) onOpenChange(false);
              }}
              className="text-xs"
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

