import { createFileRoute } from "@tanstack/react-router";

// Liveness probe for the Docker HEALTHCHECK and Coolify.
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () => Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } }),
    },
  },
});
