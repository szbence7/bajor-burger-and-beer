import { createFileRoute, redirect } from "@tanstack/react-router";

// The site is one page now; old links land on the matching section.
export const Route = createFileRoute("/foglalas")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "foglalas", statusCode: 301 });
  },
});
