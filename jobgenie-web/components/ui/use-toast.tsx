// components/ui/use-toast.tsx
"use client";

import { createContext, useContext } from "react";
import { toast as sonnerToast, Toaster as Sonner } from "sonner";

type ToastProps = React.ComponentProps<typeof Sonner>;
type ToastActionElement = React.ReactNode;

const ToastContext = createContext({ toast: sonnerToast });

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ToastActionElement;
}

export function ToastProvider({
  children,
  ...props
}: ToastProps & { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={{ toast: sonnerToast }}>
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
  
  return {
    toast: ({ title, description, variant, action }: ToastOptions) => {
      if (variant === "destructive") {
        return context.toast.error(title, {
          description,
          action,
        });
      }
      
      return context.toast(title || "", {
        description,
        action,
      });
    },
  };
}
