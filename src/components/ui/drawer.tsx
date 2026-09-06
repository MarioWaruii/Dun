import type { ComponentProps } from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

export function Drawer(props: ComponentProps<typeof Vaul.Root>) {
  return <Vaul.Root shouldScaleBackground={false} {...props} />;
}

export function DrawerPortal(props: ComponentProps<typeof Vaul.Portal>) {
  return <Vaul.Portal {...props} />;
}

export function DrawerOverlay({ className, ...props }: ComponentProps<typeof Vaul.Overlay>) {
  return (
    <Vaul.Overlay
      className={cn("fixed inset-0 z-50 bg-ink/40", className)}
      {...props}
    />
  );
}

export function DrawerContent({ className, children, ...props }: ComponentProps<typeof Vaul.Content>) {
  return (
    <Vaul.Portal>
      <DrawerOverlay />
      <Vaul.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lift outline-none",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
        {children}
      </Vaul.Content>
    </Vaul.Portal>
  );
}

export function DrawerTitle({ className, ...props }: ComponentProps<typeof Vaul.Title>) {
  return (
    <Vaul.Title
      className={cn("font-display text-xl font-medium tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function DrawerDescription({ className, ...props }: ComponentProps<typeof Vaul.Description>) {
  return (
    <Vaul.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}
