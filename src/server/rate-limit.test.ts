import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("blocks after the limit and frees up as the window slides", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.attempt("a", 0)).toBe(true);
    expect(limiter.attempt("a", 400)).toBe(true);
    expect(limiter.attempt("a", 900)).toBe(false);
    expect(limiter.attempt("b", 900)).toBe(true);
    // The attempt at 0 has left the window; the one at 400 has not.
    expect(limiter.attempt("a", 1001)).toBe(true);
    expect(limiter.attempt("a", 1200)).toBe(false);
  });
});
