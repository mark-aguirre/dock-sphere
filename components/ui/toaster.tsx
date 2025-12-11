import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function Toaster() {
  const { toasts } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, title?: string, description?: string) => {
    const textToCopy = [title, description].filter(Boolean).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isCopied = copiedId === id;
        
        return (
          <Toast key={id} {...props}>
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="whitespace-pre-line">
                    {description}
                  </ToastDescription>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopy(id, title?.toString(), description?.toString())}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-secondary transition-colors"
                  aria-label="Copy message"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                {action}
                <ToastClose />
              </div>
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
