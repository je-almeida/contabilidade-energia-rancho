import { db, ensureSettings } from "../db";
import { nowIso } from "../ids";
import type { Settings } from "../types";

export { ensureSettings };

export async function updateSettings(patch: {
  propertyName: string;
  rateDecimalPlaces: number;
}): Promise<Settings> {
  const current = await ensureSettings();
  const next: Settings = {
    ...current,
    propertyName: patch.propertyName.trim() || "Propriedade",
    rateDecimalPlaces: Math.min(8, Math.max(2, patch.rateDecimalPlaces)),
    updatedAt: nowIso(),
  };
  await db.settings.put(next);
  return next;
}
