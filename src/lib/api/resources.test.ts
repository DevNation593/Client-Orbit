import { afterEach, describe, expect, it, vi } from "vitest";
import { crmApi } from "./resources";

function stubFetch(body: unknown) {
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requested.push(url);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }),
  );
  return requested;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("crmApi.contacts", () => {
  it("asks the overview for the ten most recent records of each module", async () => {
    const overview = {
      contact: { id: 7, first_name: "Ana" },
      modules: {},
      unavailable_modules: ["tickets"],
      generated_at: "2026-10-09T12:00:00.000000Z",
    };
    const requested = stubFetch({ data: overview, meta: {} });

    const result = await crmApi.contacts.overview(7);

    expect(requested).toEqual([
      "/api/backend/contacts/7/overview?recent_limit=10",
    ]);
    expect(result).toEqual(overview);
  });

  it("requests one page of the contact timeline and returns its pagination", async () => {
    const meta = {
      current_page: 2,
      from: 26,
      last_page: 3,
      per_page: 25,
      to: 50,
      total: 61,
    };
    const requested = stubFetch({ data: [], meta });

    const result = await crmApi.contacts.timeline(7, 2);

    expect(requested).toEqual([
      "/api/backend/contacts/7/timeline?page=2&per_page=25",
    ]);
    expect(result).toEqual({ items: [], meta });
  });
});
