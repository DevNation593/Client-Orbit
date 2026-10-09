import { describe, expect, it } from "vitest";
import {
  buildViewPayload,
  filtersToQuery,
  nextSort,
  sortToQuery,
  viewColumnVisibility,
  viewSort,
  type SavedView,
} from "./saved-views";

const view: SavedView = {
  id: 1,
  entity_type: "contacts",
  name: "Prospectos",
  visibility: "private",
  sort_field: null,
  sort_direction: null,
  columns: ["name", "status"],
  is_default: false,
  user_id: 1,
  owner: { id: 1, name: "Admin" },
  filters: [{ field: "status", operator: "eq", value: "prospect" }],
};

describe("filtersToQuery", () => {
  it("writes each filter the way list endpoints read it", () => {
    expect(
      filtersToQuery([
        { field: "status", operator: "eq", value: "prospect" },
        { field: "email", operator: "contains", value: "@acme" },
      ]),
    ).toEqual({
      "filter[status][operator]": "eq",
      "filter[status][value]": "prospect",
      "filter[email][operator]": "contains",
      "filter[email][value]": "@acme",
    });
  });

  it("sends list values as repeated array parameters", () => {
    expect(
      filtersToQuery([
        { field: "status", operator: "in", value: ["active", "prospect"] },
      ]),
    ).toEqual({
      "filter[status][operator]": "in",
      "filter[status][value][]": ["active", "prospect"],
    });
  });

  it("sends operators without a value on their own", () => {
    expect(
      filtersToQuery([{ field: "phone", operator: "is_null", value: null }]),
    ).toEqual({ "filter[phone][operator]": "is_null" });
  });
});

describe("viewColumnVisibility", () => {
  const columns = ["name", "phone", "status", "actions"];

  it("shows only the columns the view lists", () => {
    expect(viewColumnVisibility(view, columns)).toEqual({
      name: true,
      phone: false,
      status: true,
      actions: false,
    });
  });

  it("shows every column for a view saved without a column list", () => {
    expect(viewColumnVisibility({ ...view, columns: null }, columns)).toEqual({
      name: true,
      phone: true,
      status: true,
      actions: true,
    });
    expect(viewColumnVisibility({ ...view, columns: [] }, columns)).toEqual({
      name: true,
      phone: true,
      status: true,
      actions: true,
    });
  });
});

describe("sortToQuery", () => {
  it("writes the order the way list endpoints read it", () => {
    expect(sortToQuery({ field: "first_name", direction: "asc" })).toEqual({
      sort: "first_name",
      direction: "asc",
    });
  });

  it("leaves the server default order when nothing is chosen", () => {
    expect(sortToQuery(null)).toEqual({});
  });
});

describe("nextSort", () => {
  it("starts ascending, then descending, then back to the default order", () => {
    const ascending = nextSort(null, "due_at");
    const descending = nextSort(ascending, "due_at");

    expect(ascending).toEqual({ field: "due_at", direction: "asc" });
    expect(descending).toEqual({ field: "due_at", direction: "desc" });
    expect(nextSort(descending, "due_at")).toBeNull();
  });

  it("starts over when another field is chosen", () => {
    expect(nextSort({ field: "due_at", direction: "desc" }, "title")).toEqual({
      field: "title",
      direction: "asc",
    });
  });
});

describe("viewSort", () => {
  it("reads the order a view was saved with", () => {
    expect(
      viewSort({ ...view, sort_field: "first_name", sort_direction: "desc" }),
    ).toEqual({ field: "first_name", direction: "desc" });
  });

  it("defaults to ascending when the view has no direction", () => {
    expect(viewSort({ ...view, sort_field: "first_name" })).toEqual({
      field: "first_name",
      direction: "asc",
    });
  });

  it("is empty for a view saved without an order", () => {
    expect(viewSort(view)).toBeNull();
  });
});

describe("buildViewPayload", () => {
  const list = {
    entityType: "contacts",
    name: "  Prospectos  ",
    filters: [{ field: "status", operator: "eq", value: "prospect" }],
    columns: ["name", "phone", "status", "actions"],
    columnVisibility: { phone: false },
  };

  it("describes the current list as a private view", () => {
    expect(buildViewPayload({ ...list, sort: null })).toEqual({
      entity_type: "contacts",
      name: "Prospectos",
      visibility: "private",
      sort_field: null,
      sort_direction: null,
      columns: ["name", "status", "actions"],
      filters: [{ field: "status", operator: "eq", value: "prospect" }],
    });
  });

  it("keeps the order of the list and who the view is shared with", () => {
    expect(
      buildViewPayload({
        ...list,
        sort: { field: "first_name", direction: "desc" },
        visibility: "tenant",
      }),
    ).toMatchObject({
      visibility: "tenant",
      sort_field: "first_name",
      sort_direction: "desc",
    });
  });
});
