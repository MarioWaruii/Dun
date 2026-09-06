import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "bg-card text-foreground border-border shadow-card font-sans rounded-xl",
          title: "text-foreground font-medium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
