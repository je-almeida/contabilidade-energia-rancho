import { describe, expect, it } from "vitest";
import { canShowResidentCalculations, canShowWellCalculations } from "./forms";

describe("canShowWellCalculations", () => {
  it("only renders poço calculations after conta and leitura atual exist", () => {
    expect(canShowWellCalculations({ bill: "", wellCurrent: "" })).toBe(false);
    expect(canShowWellCalculations({ bill: "100,00", wellCurrent: "20" })).toBe(true);
  });
});

describe("canShowResidentCalculations", () => {
  it("hides derived resident values until all required readings are filled", () => {
    expect(
      canShowResidentCalculations({
        energyCurrent: "",
        waterCurrent: "10",
        adjustment: "0",
        energyPrevious: 0,
        waterPrevious: 0,
        bill: "100,00",
        wellCurrent: "20",
      }),
    ).toBe(false);

    expect(
      canShowResidentCalculations({
        energyCurrent: "120",
        waterCurrent: "10",
        adjustment: "0",
        energyPrevious: 0,
        waterPrevious: 0,
        bill: "100,00",
        wellCurrent: "20",
      }),
    ).toBe(true);
  });
});
