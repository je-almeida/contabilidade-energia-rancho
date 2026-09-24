"use client";

import { useEffect, useState } from "react";
import { FieldError } from "@/components/Ui";
import { listResidents, addResident, updateResident, setResidentStatus } from "@/lib/repositories/residents";
import { validateResidentForm } from "@/lib/validation/forms";
import type { Resident } from "@/lib/types";

export function ResidentsScreen() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await listResidents();
    setResidents(data);
  }

  useEffect(() => {
    void (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validateResidentForm({
      name,
      unit,
      activeCount: residents.filter((r) => r.status === "active").length,
      isNew: !editingId,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (editingId) {
        await updateResident(editingId, { name, unit });
        setStatus("Morador atualizado.");
      } else {
        await addResident({ name, unit });
        setStatus("Morador adicionado.");
      }
      setName("");
      setUnit("");
      setEditingId(null);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  async function toggleStatus(resident: Resident) {
    try {
      await setResidentStatus(resident.id, resident.status === "active" ? "inactive" : "active");
      setStatus(`Status de ${resident.name} atualizado.`);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  if (loading) return <p className="muted">Carregando moradores…</p>;

  return (
    <section>
      <h2 className="page-title">Moradores</h2>
      <p className="lede">Cadastre e mantenha os dados dos moradores da propriedade.</p>

      {status ? <div className="alert">{status}</div> : null}

      <div className="card">
        <h3>{editingId ? "Editar morador" : "Adicionar morador"}</h3>
        <form onSubmit={onSubmit}>
          <label className="field">
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <FieldError message={errors.name} />
          </label>
          <label className="field">
            Identificação / unidade
            <input value={unit} onChange={(e) => setUnit(e.target.value)} />
            <FieldError message={errors.unit} />
          </label>
          {errors.form ? <div className="alert">{errors.form}</div> : null}
          <div className="row-actions">
            <button className="btn primary" type="submit">
              {editingId ? "Salvar alterações" : "Adicionar morador"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setUnit("");
                  setErrors({});
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Lista</h3>
        <div className="list">
          {residents.map((resident) => (
            <div key={resident.id} className="list-item">
              <div>
                <strong>{resident.name}</strong>
                <div className="muted">{resident.unit}</div>
              </div>
              <div className="row-actions">
                <span className={`badge badge-${resident.status}`}>{resident.status === "active" ? "Ativo" : "Inativo"}</span>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setEditingId(resident.id);
                    setName(resident.name);
                    setUnit(resident.unit);
                    setErrors({});
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => void toggleStatus(resident)}
                >
                  {resident.status === "active" ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
