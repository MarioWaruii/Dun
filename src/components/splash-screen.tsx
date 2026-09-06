import { DunMark } from "@/components/mark";

export function SplashScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <DunMark className="size-24 shadow-lift splash-mark" />
      <p className="mt-5 font-display text-4xl font-semibold tracking-tight">Dun</p>
      <p className="mt-2 text-sm text-muted-foreground">Get things done.</p>
    </div>
  );
}
