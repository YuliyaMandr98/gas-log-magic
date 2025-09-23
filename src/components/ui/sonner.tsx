import * as React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  // Автоматически закрывать toast при наведении
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Target Sonner toasts: [data-sonner-toast]
      const toastEl = (e.target as HTMLElement).closest('[data-sonner-toast]');
      if (toastEl) {
        const closeBtn = toastEl.querySelector('[data-close-button]');
        if (closeBtn) (closeBtn as HTMLElement).click();
      }
    };
    document.addEventListener('mouseover', handler);
    return () => document.removeEventListener('mouseover', handler);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
