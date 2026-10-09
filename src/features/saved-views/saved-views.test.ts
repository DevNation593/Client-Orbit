import { describe, expect, it } from "vitest";
import {
  buildViewPayload,
  filtersToQuery,
  viewColumnVisibility,
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

describe("buildViewPayload", () => {
  it("describes the current list as a private view", () => {
    expect(
      buildViewPayload({
        entityType: "contacts",
        name: "  Prospectos  ",
        filters: [{ field: "status", operator: "eq", value: "prospect" }],
        columns: ["name", "phone", "status", "actions"],
        columnVisibility: { phone: false },
      }),
    ).toEqual({
      entity_type: "contacts",
      name: "Prospectos",
      visibility: "private",
      columns: ["name", "status", "actions"],
      filters: [{ field: "status", operator: "eq", value: "prospect" }],
    });
  });
});
