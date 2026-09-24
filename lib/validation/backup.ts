import { BACKUP_SCHEMA_VERSION, type BackupPayload } from "../types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function reqString(obj: Record<string, unknown>, key: string): boolean {
  return typeof obj[key] === "string";
}

function reqNumber(obj: Record<string, unknown>, key: string): boolean {
  return typeof obj[key] === "number" && Number.isFinite(obj[key]);
}

export function parseBackupJson(raw: string): {
  ok: true;
  data: BackupPayload;
} | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Arquivo JSON inválido." };
  }
  if (!isObject(parsed)) {
    return { ok: false, error: "Backup inválido: raiz deve ser um objeto." };
  }
  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Versão de backup não suportada (${String(parsed.schemaVersion)}).`,
    };
  }
  const requiredArrays = [
    "residents",
    "competencies",
    "readings",
    "wellReadings",
    "snapshots",
  ] as const;
  for (const key of requiredArrays) {
    if (!isArray(parsed[key])) {
      return { ok: false, error: `Backup inválido: ${key} ausente.` };
    }
  }
  if (!isObject(parsed.settings)) {
    return { ok: false, error: "Backup inválido: configurações ausentes." };
  }
  const settings = parsed.settings;
  if (!reqString(settings, "propertyName") || settings.id !== "default") {
    return { ok: false, error: "Backup inválido: configurações incompletas." };
  }
  for (const r of parsed.residents as unknown[]) {
    if (!isObject(r) || !reqString(r, "id") || !reqString(r, "name")) {
      return { ok: false, error: "Backup inválido: morador malformado." };
    }
  }
  for (const c of parsed.competencies as unknown[]) {
    if (
      !isObject(c) ||
      !reqString(c, "id") ||
      !reqNumber(c, "year") ||
      !reqNumber(c, "month")
    ) {
      return { ok: false, error: "Backup inválido: competência malformada." };
    }
  }
  return { ok: true, data: parsed as unknown as BackupPayload };
}
