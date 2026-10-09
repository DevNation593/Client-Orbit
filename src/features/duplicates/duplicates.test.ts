import { describe, expect, it } from "vitest";
import { buildOverrides, conflictingFields } from "./duplicates";

const fields = [
  { name: "first_name", label: "Nombre" },
  { name: "email", label: "Correo" },
  { name: "phone", label: "Teléfono" },
  { name: "owner_id", label: "Responsable" },
];

describe("conflictingFields", () => {
  it("lists the fields where both records hold a different value", () => {
    expect(
      conflictingFields(
        { first_name: "Ana", phone: "+593990000000", owner_id: 4 },
        { first_name: "Ana María", phone: "+593991111111", owner_id: 4 },
        fields,
      ).map((field) => field.name),
    ).toEqual(["first_name", "phone"]);
  });

  it("does not ask about fields the merge fills in by itself", () => {
    expect(
      conflictingFields(
        { first_name: "Ana", phone: null, email: "" },
        { first_name: "Ana", phone: "+593991111111", email: "ana@acme.test" },
        fields,
      ),
    ).toEqual([]);
  });

  it("treats values that differ only in case or spacing as the same", () => {
    expect(
      conflictingFields(
        { email: "ana@acme.test" },
        { email: " ANA@acme.test " },
        fields,
      ),
    ).toEqual([]);
  });
});

describe("buildOverrides", () => {
  it("takes the duplicate's value for the chosen fields only", () => {
    expect(
      buildOverrides(
        { first_name: "Ana María", phone: "+593991111111", owner_id: 9 },
        ["first_name", "owner_id"],
      ),
    ).toEqual({ first_name: "Ana María", owner_id: 9 });
  });

  it("is empty when this record's values are kept", () => {
    expect(buildOverrides({ first_name: "Ana María" }, [])).toBeUndefined();
  });
});
