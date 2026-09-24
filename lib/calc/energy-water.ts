import type { CalcInput, CalcResidentResult, CalcResult } from "../types";
import { chargeCents, centsToReais } from "../money";

const ZERO_ENERGY =
  "O cálculo não pode ser realizado enquanto o consumo total de energia for zero.";
const ZERO_WATER =
  "O cálculo não pode ser realizado enquanto o consumo total de água for zero.";

export function calculatePeriod(input: CalcInput): CalcResult {
  const errors: string[] = [];
  const wellConsumption = input.wellCurrent - input.wellPrevious;

  const residents: CalcResidentResult[] = input.residents.map((r) => {
    const energyConsumption = r.energyCurrent - r.energyPrevious;
    const waterConsumption = r.waterCurrent - r.waterPrevious;
    return {
      residentId: r.residentId,
      energyPrevious: r.energyPrevious,
      energyCurrent: r.energyCurrent,
      energyConsumption,
      waterPrevious: r.waterPrevious,
      waterCurrent: r.waterCurrent,
      waterConsumption,
      energyCostCents: null,
      waterCostCents: null,
      adjustmentCents: r.adjustmentCents,
      totalCents: null,
    };
  });

  const residentEnergy = residents.reduce(
    (sum, r) => sum + r.energyConsumption,
    0,
  );
  const totalEnergyConsumption = residentEnergy + wellConsumption;
  const totalWaterConsumption = residents.reduce(
    (sum, r) => sum + r.waterConsumption,
    0,
  );

  let rateKwh: number | null = null;
  let wellCostCents: number | null = null;
  let rateM3: number | null = null;

  if (totalEnergyConsumption <= 0) {
    errors.push(ZERO_ENERGY);
  } else {
    rateKwh = centsToReais(input.energyBillCents) / totalEnergyConsumption;
    wellCostCents = chargeCents(wellConsumption, rateKwh);
    if (totalWaterConsumption <= 0) {
      errors.push(ZERO_WATER);
    } else {
      rateM3 = centsToReais(wellCostCents) / totalWaterConsumption;
    }
  }

  if (rateKwh !== null) {
    for (const r of residents) {
      r.energyCostCents = chargeCents(r.energyConsumption, rateKwh);
      r.waterCostCents =
        rateM3 === null ? null : chargeCents(r.waterConsumption, rateM3);
      if (r.energyCostCents !== null && r.waterCostCents !== null) {
        r.totalCents = r.energyCostCents + r.waterCostCents + r.adjustmentCents;
      }
    }
  }

  const allTotals = residents.every((r) => r.totalCents !== null);
  const grandTotalCents = allTotals
    ? residents.reduce((sum, r) => sum + (r.totalCents ?? 0), 0)
    : null;

  return {
    wellPrevious: input.wellPrevious,
    wellCurrent: input.wellCurrent,
    wellConsumption,
    wellCostCents,
    totalEnergyConsumption,
    totalWaterConsumption,
    rateKwh,
    rateM3,
    energyBillCents: input.energyBillCents,
    residents,
    grandTotalCents,
    canClose: errors.length === 0 && rateKwh !== null && rateM3 !== null,
    errors,
  };
}
