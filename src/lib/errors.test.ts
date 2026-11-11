import { describe, expect, it } from "vitest";
import { errorDetails } from "./errors";

describe("error diagnostics", () => {
  it("preserves Error stack and cause, including plain database error fields", () => {
    const cause = { code: "PGRST205", message: "missing table", details: null, hint: null };
    const error = new Error("Menu load failed", { cause });
    expect(errorDetails(error)).toMatchObject({
      name: "Error",
      message: error.message,
      stack: error.stack,
      cause,
    });
  });
  it("handles circular causes", () => {
    const error = new Error("circular");
    error.cause = error;
    expect(errorDetails(error)).toMatchObject({ cause: "[circular]" });
  });
});
