import { calculatePeriod } from "../calc/energy-water";
import { lastValidPrevious } from "../calc/previous-reading";
import { db } from "../db";
import { createId, nowIso } from "../ids";
import { reaisToCents } from "../money";
import type {
  CalcResult,
  Competency,
  CompetencySnapshot,
  Reading,
  WellReading,
} from "../types";

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export async function listCompetencies(): Promise<Competency[]> {
  const all = await db.competencies.toArray();
  return all.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export async function getCompetency(id: string): Promise<Competency | undefined> {
  return db.competencies.get(id);
}

export async function findCompetencyByMonth(
  year: number,
  month: number,
): Promise<Competency | undefined> {
  return db.competencies.where("[year+month]").equals([year, month]).first();
}

export async function getReadings(competencyId: string): Promise<Reading[]> {
  return db.readings.where("competencyId").equals(competencyId).toArray();
}

export async function getWellReading(
  competencyId: string,
): Promise<WellReading | undefined> {
  return db.wellReadings.where("competencyId").equals(competencyId).first();
}

export async function getSnapshot(
  competencyId: string,
): Promise<CompetencySnapshot | undefined> {
  return db.snapshots.where("competencyId").equals(competencyId).first();
}

export async function previousWellReading(
  year: number,
  month: number,
): Promise<number> {
  const comps = await db.competencies.toArray();
  const wells = await db.wellReadings.toArray();
  const byComp = new Map(wells.map((w) => [w.competencyId, w]));
  const history = comps.map((c) => ({
    year: c.year,
    month: c.month,
    status: c.status,
    value: byComp.get(c.id)?.current ?? 0,
  }));
  return lastValidPrevious(history, year, month);
}

export async function previousResidentReadings(
  year: number,
  month: number,
  residentIds: string[],
): Promise<Record<string, { energy: number; water: number }>> {
  const comps = await db.competencies.toArray();
  const readings = await db.readings.toArray();
  const result: Record<string, { energy: number; water: number }> = {};
  for (const id of residentIds) {
    const ofResident = readings.filter((r) => r.residentId === id);
    const energyHistory = ofResident.map((r) => {
      const c = comps.find((x) => x.id === r.competencyId);
      return {
        year: c?.year ?? 0,
        month: c?.month ?? 0,
        status: c?.status ?? "cancelled",
        value: r.energyCurrent,
      };
    });
    const waterHistory = ofResident.map((r) => {
      const c = comps.find((x) => x.id === r.competencyId);
      return {
        year: c?.year ?? 0,
        month: c?.month ?? 0,
        status: c?.status ?? "cancelled",
        value: r.waterCurrent,
      };
    });
    result[id] = {
      energy: lastValidPrevious(energyHistory, year, month),
      water: lastValidPrevious(waterHistory, year, month),
    };
  }
  return result;
}

export function persistFromCalc(
  competencyId: string,
  calc: CalcResult,
  isDemo?: boolean,
): {
  readings: Reading[];
  well: WellReading;
  snapshot: CompetencySnapshot;
} {
  const readings: Reading[] = calc.residents.map((r) => ({
    id: createId(),
    competencyId,
    residentId: r.residentId,
    energyCurrent: r.energyCurrent,
    waterCurrent: r.waterCurrent,
    adjustmentCents: r.adjustmentCents,
    energyPrevious: r.energyPrevious,
    waterPrevious: r.waterPrevious,
    energyConsumption: r.energyConsumption,
    waterConsumption: r.waterConsumption,
    energyCostCents: r.energyCostCents,
    waterCostCents: r.waterCostCents,
    totalCents: r.totalCents,
    isDemo,
  }));
  const well: WellReading = {
    id: createId(),
    competencyId,
    current: calc.wellCurrent,
    previous: calc.wellPrevious,
    consumption: calc.wellConsumption,
    costCents: calc.wellCostCents,
    isDemo,
  };
  const snapshot: CompetencySnapshot = {
    id: createId(),
    competencyId,
    energyBillCents: calc.energyBillCents,
    totalEnergyConsumption: calc.totalEnergyConsumption,
    rateKwh: calc.rateKwh,
    wellConsumption: calc.wellConsumption,
    wellCostCents: calc.wellCostCents,
    totalWaterConsumption: calc.totalWaterConsumption,
    rateM3: calc.rateM3,
    residentCount: calc.residents.length,
    grandTotalCents: calc.grandTotalCents,
    calcError: calc.errors[0],
    isDemo,
  };
  return { readings, well, snapshot };
}

export interface SavePeriodInput {
  id?: string;
  year: number;
  month: number;
  energyBillCents: number;
  wellCurrent: number;
  residents: {
    residentId: string;
    energyCurrent: number;
    waterCurrent: number;
    adjustmentCents: number;
  }[];
  isDemo?: boolean;
}

export async function savePeriod(input: SavePeriodInput): Promise<string> {
  const duplicate = await findCompetencyByMonth(input.year, input.month);
  if (duplicate && duplicate.id !== input.id) {
    throw new DomainError("Já existe uma competência para este mês/ano.");
  }

  const existing = input.id ? await db.competencies.get(input.id) : undefined;
  if (existing && existing.status === "closed") {
    throw new DomainError(
      "Competência fechada. Reabra para alterar os dados.",
    );
  }
  if (existing && existing.status === "cancelled") {
    throw new DomainError("Competência cancelada não pode ser alterada.");
  }

  const prevWell = await previousWellReading(input.year, input.month);
  if (input.wellCurrent < prevWell) {
    throw new DomainError(
      `A leitura atual do poço não pode ser menor que a anterior (${prevWell}).`,
    );
  }
  const prevRes = await previousResidentReadings(
    input.year,
    input.month,
    input.residents.map((r) => r.residentId),
  );
  for (const r of input.residents) {
    const prev = prevRes[r.residentId] ?? { energy: 0, water: 0 };
    if (r.energyCurrent < prev.energy) {
      throw new DomainError(
        "A leitura atual de energia não pode ser menor que a anterior.",
      );
    }
    if (r.waterCurrent < prev.water) {
      throw new DomainError(
        "A leitura atual de água não pode ser menor que a anterior.",
      );
    }
  }

  const calc = calculatePeriod({
    energyBillCents: input.energyBillCents,
    wellCurrent: input.wellCurrent,
    wellPrevious: prevWell,
    residents: input.residents.map((r) => {
      const prev = prevRes[r.residentId] ?? { energy: 0, water: 0 };
      return {
        residentId: r.residentId,
        energyCurrent: r.energyCurrent,
        energyPrevious: prev.energy,
        waterCurrent: r.waterCurrent,
        waterPrevious: prev.water,
        adjustmentCents: r.adjustmentCents,
      };
    }),
  });

  const now = nowIso();
  const id = existing?.id ?? createId();
  const competency: Competency = {
    id,
    year: input.year,
    month: input.month,
    status: existing?.status ?? "open",
    energyBillCents: input.energyBillCents,
    wellCurrentReading: input.wellCurrent,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    closedAt: existing?.closedAt,
    cancelledAt: existing?.cancelledAt,
    reopenedAt: existing?.reopenedAt,
    cancelReason: existing?.cancelReason,
    isDemo: input.isDemo ?? existing?.isDemo,
  };

  const persisted = persistFromCalc(id, calc, competency.isDemo);

  await db.transaction(
    "rw",
    db.competencies,
    db.readings,
    db.wellReadings,
    db.snapshots,
    async () => {
      await db.competencies.put(competency);
      await db.readings.where("competencyId").equals(id).delete();
      await db.wellReadings.where("competencyId").equals(id).delete();
      await db.snapshots.where("competencyId").equals(id).delete();
      await db.readings.bulkAdd(persisted.readings);
      await db.wellReadings.add(persisted.well);
      await db.snapshots.add(persisted.snapshot);
    },
  );

  return id;
}

export async function closePeriod(id: string): Promise<void> {
  const c = await requireOpen(id);
  const snapshot = await getSnapshot(id);
  if (!snapshot || snapshot.rateKwh === null || snapshot.rateM3 === null) {
    throw new DomainError(
      "Não é possível fechar enquanto o cálculo não puder ser realizado.",
    );
  }
  const now = nowIso();
  await db.competencies.update(id, {
    status: "closed",
    closedAt: now,
    updatedAt: now,
  });
  void c;
}

export async function reopenPeriod(id: string): Promise<void> {
  const existing = await db.competencies.get(id);
  if (!existing) throw new DomainError("Competência não encontrada.");
  if (existing.status !== "closed") {
    throw new DomainError("Somente competências fechadas podem ser reabertas.");
  }
  const now = nowIso();
  await db.competencies.update(id, {
    status: "open",
    reopenedAt: now,
    updatedAt: now,
  });
}

export async function cancelPeriod(
  id: string,
  reason?: string,
): Promise<void> {
  const existing = await db.competencies.get(id);
  if (!existing) throw new DomainError("Competência não encontrada.");
  if (existing.status === "cancelled") {
    throw new DomainError("Competência já está cancelada.");
  }
  const now = nowIso();
  await db.competencies.update(id, {
    status: "cancelled",
    cancelledAt: now,
    cancelReason: reason?.trim() || undefined,
    updatedAt: now,
  });
}

async function requireOpen(id: string): Promise<Competency> {
  const existing = await db.competencies.get(id);
  if (!existing) throw new DomainError("Competência não encontrada.");
  if (existing.status !== "open") {
    throw new DomainError("Somente competências abertas podem ser fechadas.");
  }
  return existing;
}

export async function latestDashboardCompetency(): Promise<
  Competency | undefined
> {
  const all = await listCompetencies();
  return (
    all.find((c) => c.status === "open") ??
    all.find((c) => c.status === "closed") ??
    all[0]
  );
}

export { reaisToCents };
