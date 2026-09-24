import { describe, expect, it } from "vitest";
import { chargeCents, reaisToCents, roundHalfUp } from "../money";
import { calculatePeriod } from "./energy-water";
import { lastValidPrevious } from "./previous-reading";

describe("money", () => {
  it("converts reais to cents with HALF_UP", () => {
    expect(reaisToCents(10)).toBe(1000);
    expect(reaisToCents(1.005)).toBe(101);
    expect(reaisToCents(-5.5)).toBe(-550);
  });

  it("charges consumption × rate as cents", () => {
    expect(chargeCents(10, 0.5)).toBe(500);
  });

  it("roundHalfUp never returns NaN", () => {
    expect(roundHalfUp(Number.NaN)).toBe(0);
    expect(roundHalfUp(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("lastValidPrevious", () => {
  it("returns 0 on first launch", () => {
    expect(lastValidPrevious([], 2026, 3)).toBe(0);
  });

  it("ignores cancelled competencies", () => {
    expect(
      lastValidPrevious(
        [
          { year: 2026, month: 1, status: "cancelled", value: 99 },
          { year: 2026, month: 2, status: "closed", value: 40 },
        ],
        2026,
        3,
      ),
    ).toBe(40);
  });
});

describe("calculatePeriod", () => {
  it("computes energy, well, water and totals", () => {
    const result = calculatePeriod({
      energyBillCents: 20000,
      wellCurrent: 20,
      wellPrevious: 0,
      residents: [
        {
          residentId: "a",
          energyCurrent: 50,
          energyPrevious: 0,
          waterCurrent: 10,
          waterPrevious: 0,
          adjustmentCents: -500,
        },
        {
          residentId: "b",
          energyCurrent: 30,
          energyPrevious: 0,
          waterCurrent: 10,
          waterPrevious: 0,
          adjustmentCents: 0,
        },
      ],
    });

    expect(result.totalEnergyConsumption).toBe(100);
    expect(result.rateKwh).toBeCloseTo(2, 8);
    expect(result.wellConsumption).toBe(20);
    expect(result.wellCostCents).toBe(4000);
    expect(result.totalWaterConsumption).toBe(20);
    expect(result.rateM3).toBeCloseTo(2, 8);
    const a = result.residents[0];
    expect(a.energyCostCents).toBe(10000);
    expect(a.waterCostCents).toBe(2000);
    expect(a.totalCents).toBe(11500);
    expect(result.canClose).toBe(true);
    expect(result.grandTotalCents).toBe(19500);
  });

  it("handles zero energy without NaN", () => {
    const result = calculatePeriod({
      energyBillCents: 10000,
      wellCurrent: 0,
      wellPrevious: 0,
      residents: [
        {
          residentId: "a",
          energyCurrent: 0,
          energyPrevious: 0,
          waterCurrent: 5,
          waterPrevious: 0,
          adjustmentCents: 0,
        },
      ],
    });
    expect(result.rateKwh).toBeNull();
    expect(result.canClose).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.residents[0].energyCostCents).toBeNull();
    expect(Number.isFinite(result.totalEnergyConsumption)).toBe(true);
  });

  it("handles zero water without NaN", () => {
    const result = calculatePeriod({
      energyBillCents: 10000,
      wellCurrent: 10,
      wellPrevious: 0,
      residents: [
        {
          residentId: "a",
          energyCurrent: 10,
          energyPrevious: 0,
          waterCurrent: 0,
          waterPrevious: 0,
          adjustmentCents: 0,
        },
      ],
    });
    expect(result.rateKwh).not.toBeNull();
    expect(result.rateM3).toBeNull();
    expect(result.canClose).toBe(false);
    expect(result.residents[0].waterCostCents).toBeNull();
  });
});
