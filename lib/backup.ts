import { BACKUP_SCHEMA_VERSION, type BackupPayload } from "./types";
import { db, ensureSettings } from "./db";

export async function exportBackup(): Promise<BackupPayload> {
  const settings = await ensureSettings();
  const [
    residents,
    competencies,
    readings,
    wellReadings,
    snapshots,
  ] = await Promise.all([
    db.residents.toArray(),
    db.competencies.toArray(),
    db.readings.toArray(),
    db.wellReadings.toArray(),
    db.snapshots.toArray(),
  ]);
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    residents,
    competencies,
    readings,
    wellReadings,
    snapshots,
    settings,
  };
}

export function summarizeBackup(data: BackupPayload): string {
  return [
    `${data.residents.length} morador(es)`,
    `${data.competencies.length} competência(s)`,
    `${data.readings.length} leitura(s)`,
    `propriedade: ${data.settings.propertyName}`,
  ].join(" · ");
}

export async function restoreBackup(data: BackupPayload): Promise<void> {
  await db.transaction(
    "rw",
    db.residents,
    db.competencies,
    db.readings,
    db.wellReadings,
    db.snapshots,
    async () => {
      await db.residents.clear();
      await db.competencies.clear();
      await db.readings.clear();
      await db.wellReadings.clear();
      await db.snapshots.clear();
      await db.residents.bulkAdd(data.residents);
      await db.competencies.bulkAdd(data.competencies);
      await db.readings.bulkAdd(data.readings);
      await db.wellReadings.bulkAdd(data.wellReadings);
      await db.snapshots.bulkAdd(data.snapshots);
    },
  );
  await db.settings.clear();
  await db.settings.put(data.settings);
}
