import { afterEach, describe, expect, it, vi } from "vitest";
import { isPathEnabled, parseEnabledModules } from "./modules";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseEnabledModules", () => {
  it("enables every module when nothing is configured", () => {
    const modules = parseEnabledModules(undefined);

    expect(modules.has("contacts")).toBe(true);
    expect(modules.has("reports")).toBe(true);
    expect(parseEnabledModules("  ")).toEqual(modules);
  });

  it("enables only the listed modules", () => {
    expect([...parseEnabledModules("contacts, tasks ,deals")]).toEqual([
      "contacts",
      "tasks",
      "deals",
    ]);
  });

  it("ignores names that are not modules of this app", () => {
    expect([...parseEnabledModules("contacts,billing")]).toEqual(["contacts"]);
  });
});

describe("isPathEnabled", () => {
  const enabled = parseEnabledModules("contacts,tasks");

  it("follows the module a path belongs to, at any depth", () => {
    expect(isPathEnabled("/contacts", enabled)).toBe(true);
    expect(isPathEnabled("/contacts/7", enabled)).toBe(true);
    expect(isPathEnabled("/leads", enabled)).toBe(false);
    expect(isPathEnabled("/leads/new", enabled)).toBe(false);
  });

  it("does not confuse a path with a module that shares its prefix", () => {
    expect(isPathEnabled("/tasks-archive", enabled)).toBe(true);
  });

  it("never switches off what is not a module", () => {
    expect(isPathEnabled("/", enabled)).toBe(true);
    expect(isPathEnabled("/settings/team", enabled)).toBe(true);
    expect(isPathEnabled("/profile", enabled)).toBe(true);
  });

  it("reads the deployment setting by default", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLED_MODULES", "contacts");

    expect(isPathEnabled("/contacts")).toBe(true);
    expect(isPathEnabled("/deals")).toBe(false);
  });
});
