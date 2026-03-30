import { describe, expect, it } from "vitest";
import { extractWubrgFromManaCost } from "./manaCostPips";

describe("extractWubrgFromManaCost", () => {
  it("single pips", () => {
    expect(extractWubrgFromManaCost("{2}{R}")).toEqual(["R"]);
    expect(extractWubrgFromManaCost("{W}{W}")).toEqual(["W"]);
  });

  it("hybrid", () => {
    expect(extractWubrgFromManaCost("{W/U}")).toEqual(["W", "U"]);
  });

  it("phyrexian / generic hybrid", () => {
    expect(extractWubrgFromManaCost("{W/P}")).toEqual(["W"]);
    expect(extractWubrgFromManaCost("{2/W}")).toEqual(["W"]);
  });
});
