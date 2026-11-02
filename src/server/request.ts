import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

/**
 * Client IP for rate limiting. Coolify's Traefik sets X-Real-IP and appends the peer to
 * X-Forwarded-For (overwriting anything the client sent), so the last XFF entry is the one
 * the proxy saw. Falls back to the socket address when running without a proxy.
 */
export function getClientIp(): string {
  const realIp = getRequestHeader("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = getRequestHeader("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwarded || getRequestIP() || "unknown";
}

/** The admin's Supabase access token from `Authorization: Bearer …`, or "" when absent. */
export function getBearerToken(): string {
  return getRequestHeader("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? "";
}
