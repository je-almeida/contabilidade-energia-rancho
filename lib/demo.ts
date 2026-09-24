import { calculatePeriod } from "./calc/energy-water";
import { db } from "./db";
import { createId, nowIso } from "./ids";
import { persistFromCalc } from "./repositories/periods";
import { addResident } from "./repositories/residents";
import type { Competency } from "./types";

export async function hasUserData(): Promise<boolean> {
  const [residents, comps] = await Promise.all([
    db.residents.filter((r) => !r.isDemo).count(),
    db.competencies.filter((c) => !c.isDemo).count(),
  ]);
  return residents > 0 || comps > 0;
}

export async function hasDemoData(): Promise<boolean> {
  const n = await db.residents.filter((r) => r.isDemo === true).count();
  return n > 0;
}

export async function removeDemoData(): Promise<void> {
  await db.transaction(
    "rw",
    db.residents,
    db.competencies,
    db.readings,
    db.wellReadings,
    db.snapshots,
    async () => {
      const comps = await db.competencies.filter((c) => c.isDemo === true).toArray();
      for (const c of comps) {
        await db.readings.where("competencyId").equals(c.id).delete();
        await db.wellReadings.where("competencyId").equals(c.id).delete();
        await db.snapshots.where("competencyId").equals(c.id).delete();
      }
      await db.competencies.filter((c) => c.isDemo === true).delete();
      await db.residents.filter((r) => r.isDemo === true).delete();
    },
  );
}

export async function loadDemoData(): Promise<void> {
  if (await hasUserData()) {
    throw new Error(
      "Há dados reais no aplicativo. Remova-os ou use outro dispositivo para carregar a demonstração.",
    );
  }
  await removeDemoData();

  const a = await addResident({
    name: "Ana Souza",
    unit: "Casa 1",
    isDemo: true,
  });
  const b = await addResident({
    name: "Bruno Lima",
    unit: "Casa 2",
    isDemo: true,
  });
  const now = nowIso();

  async function seedMonth(
    year: number,
    month: number,
    billCents: number,
    well: { prev: number; curr: number },
    rows: {
      residentId: string;
      ePrev: number;
      eCurr: number;
      wPrev: number;
      wCurr: number;
      adj: number;
    }[],
    status: Competency["status"],
  ) {
    const id = createId();
    const calc = calculatePeriod({
      energyBillCents: billCents,
      wellCurrent: well.curr,
      wellPrevious: well.prev,
      residents: rows.map((r) => ({
        residentId: r.residentId,
        energyCurrent: r.eCurr,
        energyPrevious: r.ePrev,
        waterCurrent: r.wCurr,
        waterPrevious: r.wPrev,
        adjustmentCents: r.adj,
      })),
    });
    const persisted = persistFromCalc(id, calc, true);
    const competency: Competency = {
      id,
      year,
      month,
      status,
      energyBillCents: billCents,
      wellCurrentReading: well.curr,
      createdAt: now,
      updatedAt: now,
      closedAt: status === "closed" ? now : undefined,
      isDemo: true,
    };
    await db.competencies.add(competency);
    await db.readings.bulkAdd(persisted.readings);
    await db.wellReadings.add(persisted.well);
    await db.snapshots.add(persisted.snapshot);
  }

  await seedMonth(
    2026,
    1,
    30000,
    { prev: 0, curr: 20 },
    [
      {
        residentId: a.id,
        ePrev: 0,
        eCurr: 80,
        wPrev: 0,
        wCurr: 12,
        adj: 0,
      },
      {
        residentId: b.id,
        ePrev: 0,
        eCurr: 50,
        wPrev: 0,
        wCurr: 8,
        adj: -500,
      },
    ],
    "closed",
  );

  await seedMonth(
    2026,
    2,
    28000,
    { prev: 20, curr: 38 },
    [
      {
        residentId: a.id,
        ePrev: 80,
        eCurr: 155,
        wPrev: 12,
        wCurr: 22,
        adj: 0,
      },
      {
        residentId: b.id,
        ePrev: 50,
        eCurr: 90,
        wPrev: 8,
        wCurr: 16,
        adj: 200,
      },
    ],
    "open",
  );
}
