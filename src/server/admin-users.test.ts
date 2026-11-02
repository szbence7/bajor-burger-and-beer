import { describe, expect, it } from "vitest";
import { temporaryPassword } from "./admin-users";

describe("temporaryPassword", () => {
  it("is 12 unambiguous characters and different every time", () => {
    const a = temporaryPassword();
    expect(a).toMatch(/^[a-km-zA-HJ-NP-Z2-9]{12}$/);
    expect(a).not.toMatch(/[0O1lI]/);
    expect(temporaryPassword()).not.toBe(a);
  });
});
