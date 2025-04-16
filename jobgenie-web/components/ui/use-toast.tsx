// components/ui/use-toast.tsx
"use client";

import { createContext, useContext, useState } from "react";
import { Toaster as Sonner } from "sonner";

type ToastProps = React.ComponentProps<typeof Sonner>;

const ToastContext = createContext<{
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
}>({
  toast: () => {},
});

export function ToastProvider({
  children,
  ...props
}: ToastProps & { children: React.ReactNode }) {
  const [, setToasts] = useState<Array<{ id: string; title?: string; description?: string; variant?: "default" | "destructive" }>>([]);

  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Sonner
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            title: "group-[.toast]:text-foreground text-sm font-semibold",
            description: "group-[.toast]:text-muted-foreground text-sm",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            error:
              "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
            success:
              "group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success",
          },
        }}
        {...props}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}
