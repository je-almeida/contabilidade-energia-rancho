import Dexie, { type EntityTable } from "dexie";
import type {
  Competency,
  CompetencySnapshot,
  Reading,
  Resident,
  Settings,
  WellReading,
} from "./types";
import { SETTINGS_ID } from "./types";
import { nowIso } from "./ids";

export class EnergyDB extends Dexie {
  residents!: EntityTable<Resident, "id">;
  competencies!: EntityTable<Competency, "id">;
  readings!: EntityTable<Reading, "id">;
  wellReadings!: EntityTable<WellReading, "id">;
  snapshots!: EntityTable<CompetencySnapshot, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("contabilidade-energia");
    this.version(1).stores({
      residents: "id, status, name",
      competencies: "id, [year+month], year, month, status, createdAt",
      readings: "id, competencyId, residentId, [competencyId+residentId]",
      wellReadings: "id, competencyId",
      snapshots: "id, competencyId",
      settings: "id",
    });
  }
}

export const db = new EnergyDB();

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) return existing;
  const settings: Settings = {
    id: SETTINGS_ID,
    propertyName: "Propriedade",
    rateDecimalPlaces: 6,
    updatedAt: nowIso(),
  };
  await db.settings.put(settings);
  return settings;
}
