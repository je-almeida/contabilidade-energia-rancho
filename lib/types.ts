export type ResidentStatus = "active" | "inactive";
export type CompetencyStatus = "open" | "closed" | "cancelled";

export interface Resident {
  id: string;
  name: string;
  unit: string;
  status: ResidentStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface Competency {
  id: string;
  year: number;
  month: number;
  status: CompetencyStatus;
  energyBillCents: number;
  wellCurrentReading: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  cancelledAt?: string;
  reopenedAt?: string;
  cancelReason?: string;
  isDemo?: boolean;
}

export interface Reading {
  id: string;
  competencyId: string;
  residentId: string;
  energyCurrent: number;
  waterCurrent: number;
  adjustmentCents: number;
  energyPrevious: number;
  waterPrevious: number;
  energyConsumption: number;
  waterConsumption: number;
  energyCostCents: number | null;
  waterCostCents: number | null;
  totalCents: number | null;
  isDemo?: boolean;
}

export interface WellReading {
  id: string;
  competencyId: string;
  current: number;
  previous: number;
  consumption: number;
  costCents: number | null;
  isDemo?: boolean;
}

export interface CompetencySnapshot {
  id: string;
  competencyId: string;
  energyBillCents: number;
  totalEnergyConsumption: number;
  rateKwh: number | null;
  wellConsumption: number;
  wellCostCents: number | null;
  totalWaterConsumption: number;
  rateM3: number | null;
  residentCount: number;
  grandTotalCents: number | null;
  calcError?: string;
  isDemo?: boolean;
}

export interface Settings {
  id: "default";
  propertyName: string;
  rateDecimalPlaces: number;
  updatedAt: string;
}

export interface CalcResidentInput {
  residentId: string;
  energyCurrent: number;
  energyPrevious: number;
  waterCurrent: number;
  waterPrevious: number;
  adjustmentCents: number;
}

export interface CalcInput {
  energyBillCents: number;
  wellCurrent: number;
  wellPrevious: number;
  residents: CalcResidentInput[];
}

export interface CalcResidentResult {
  residentId: string;
  energyPrevious: number;
  energyCurrent: number;
  energyConsumption: number;
  waterPrevious: number;
  waterCurrent: number;
  waterConsumption: number;
  energyCostCents: number | null;
  waterCostCents: number | null;
  adjustmentCents: number;
  totalCents: number | null;
}

export interface CalcResult {
  wellPrevious: number;
  wellCurrent: number;
  wellConsumption: number;
  wellCostCents: number | null;
  totalEnergyConsumption: number;
  totalWaterConsumption: number;
  rateKwh: number | null;
  rateM3: number | null;
  energyBillCents: number;
  residents: CalcResidentResult[];
  grandTotalCents: number | null;
  canClose: boolean;
  errors: string[];
}

export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  residents: Resident[];
  competencies: Competency[];
  readings: Reading[];
  wellReadings: WellReading[];
  snapshots: CompetencySnapshot[];
  settings: Settings;
}

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MAX_RESIDENTS = 20;
export const SETTINGS_ID = "default" as const;
