import { describe, expect, it } from "vitest";
import { buildHistoryPdfHtml } from "./pdf";

describe("buildHistoryPdfHtml", () => {
  it("includes the competency header and resident reading structure for export", () => {
    const html = buildHistoryPdfHtml({
      competency: {
        id: "c1",
        year: 2026,
        month: 9,
        status: "closed",
        energyBillCents: 200000,
        wellCurrentReading: 250,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-30T00:00:00.000Z",
      },
      snapshot: {
        id: "s1",
        competencyId: "c1",
        energyBillCents: 200000,
        totalEnergyConsumption: 120,
        rateKwh: 1.5,
        wellConsumption: 30,
        wellCostCents: 6000,
        totalWaterConsumption: 50,
        rateM3: 2.4,
        residentCount: 2,
        grandTotalCents: 260000,
      },
      readings: [
        {
          id: "r1",
          competencyId: "c1",
          residentId: "resident-a",
          energyCurrent: 90,
          energyPrevious: 40,
          waterCurrent: 20,
          waterPrevious: 10,
          adjustmentCents: 0,
          energyConsumption: 50,
          waterConsumption: 10,
          energyCostCents: 7500,
          waterCostCents: 2400,
          totalCents: 9900,
        },
        {
          id: "r2",
          competencyId: "c1",
          residentId: "resident-b",
          energyCurrent: 110,
          energyPrevious: 65,
          waterCurrent: 25,
          waterPrevious: 12,
          adjustmentCents: 0,
          energyConsumption: 45,
          waterConsumption: 13,
          energyCostCents: 6750,
          waterCostCents: 3120,
          totalCents: 9870,
        },
      ],
      residents: new Map([
        ["resident-a", { id: "resident-a", name: "Morador A", unit: "A1", status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
        ["resident-b", { id: "resident-b", name: "Morador B", unit: "B2", status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
      ]),
      well: {
        id: "w1",
        competencyId: "c1",
        current: 250,
        previous: 220,
        consumption: 30,
        costCents: 6000,
      },
    });

    expect(html).toContain("Competência");
    expect(html).toContain("Setembro/2026");
    expect(html).toContain("Valor Unitário KW");
    expect(html).toContain("Valor Unitário M³");
    expect(html).toContain("Morador A");
    expect(html).toContain("Leitura KW anterior");
    expect(html).toContain("Valor total em R$");
  });
});
