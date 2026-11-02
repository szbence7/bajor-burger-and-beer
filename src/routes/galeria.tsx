import { createFileRoute, redirect } from "@tanstack/react-router";

// The site is one page now; old links land on the matching section.
export const Route = createFileRoute("/galeria")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "hely", statusCode: 301 });
  },
});
