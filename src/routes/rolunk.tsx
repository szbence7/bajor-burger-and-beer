import { createFileRoute, redirect } from "@tanstack/react-router";

// The site is one page now; old links land on the matching section.
export const Route = createFileRoute("/rolunk")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "rolunk", statusCode: 301 });
  },
});
