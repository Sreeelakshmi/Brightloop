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
 * Modal confirmation dialog for sensitive actions styled with Brightloop palette.
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#1F2622]/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal Window */}
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white border border-[#D5DDD2] rounded-xl p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0",
                  variant === "orange" ? "bg-[#F27B4B]" : "bg-[#1F2622]"
                )}
              >
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C9B8E] block">
                  ACTION REQUIRED
                </span>
                <DialogPrimitive.Title className="text-base font-bold text-[#1F2622]">
                  {title}
                </DialogPrimitive.Title>
              </div>
            </div>

            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="text-[#8C9B8E] hover:text-[#1F2622] p-1.5 rounded-lg hover:bg-[#EBF1EA] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* Description */}
          <DialogPrimitive.Description className="text-xs text-[#8C9B8E] leading-relaxed mb-6">
            {description}
          </DialogPrimitive.Description>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D5DDD2]">
            <DialogPrimitive.Close asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs border-[#D5DDD2] text-[#1F2622] hover:bg-[#EBF1EA]"
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
