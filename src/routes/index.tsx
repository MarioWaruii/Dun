import { createFileRoute } from "@tanstack/react-router";
import { AppGate } from "@/components/app-gate";
import { AppHome } from "@/components/app-home";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppGate>
      <AppHome />
    </AppGate>
  );
}
