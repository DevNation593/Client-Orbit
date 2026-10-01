import { describe, expect, it } from "vitest";
import { formatCurrency, initials, titleCase } from "./utils";

describe("frontend utilities", () => {
  it("creates stable initials for a person", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
  });

  it("formats currency using the requested currency", () => {
    expect(formatCurrency(2500, "USD")).toContain("2.500");
  });

  it("turns machine-readable labels into readable text", () => {
    expect(titleCase("multi_select")).toBe("Multi Select");
  });
});
