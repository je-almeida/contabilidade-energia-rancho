import { db } from "../db";
import { createId, nowIso } from "../ids";
import { MAX_RESIDENTS, type Resident, type ResidentStatus } from "../types";

export async function listResidents(): Promise<Resident[]> {
  const all = await db.residents.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function listActiveResidents(): Promise<Resident[]> {
  const all = await listResidents();
  return all.filter((r) => r.status === "active");
}

export async function getResident(id: string): Promise<Resident | undefined> {
  return db.residents.get(id);
}

export async function countResidents(): Promise<number> {
  return db.residents.count();
}

export async function addResident(input: {
  name: string;
  unit: string;
  isDemo?: boolean;
}): Promise<Resident> {
  const count = await db.residents.count();
  if (count >= MAX_RESIDENTS) {
    throw new Error("O máximo de 20 moradores já foi atingido.");
  }
  const now = nowIso();
  const resident: Resident = {
    id: createId(),
    name: input.name.trim(),
    unit: input.unit.trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    isDemo: input.isDemo,
  };
  await db.residents.add(resident);
  return resident;
}

export async function updateResident(
  id: string,
  patch: { name: string; unit: string },
): Promise<void> {
  const existing = await db.residents.get(id);
  if (!existing) throw new Error("Morador não encontrado.");
  await db.residents.update(id, {
    name: patch.name.trim(),
    unit: patch.unit.trim(),
    updatedAt: nowIso(),
  });
}

export async function setResidentStatus(
  id: string,
  status: ResidentStatus,
): Promise<void> {
  const existing = await db.residents.get(id);
  if (!existing) throw new Error("Morador não encontrado.");
  await db.residents.update(id, { status, updatedAt: nowIso() });
}
