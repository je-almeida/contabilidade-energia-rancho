"use client";

import { useEffect, useRef, useState } from "react";
import { exportBackup, restoreBackup, summarizeBackup } from "@/lib/backup";
import { loadDemoData, removeDemoData } from "@/lib/demo";
import { ensureSettings, updateSettings } from "@/lib/repositories/settings";
import { parseBackupJson } from "@/lib/validation/backup";
import type { BackupPayload, Settings } from "@/lib/types";

export function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [propertyName, setPropertyName] = useState("");
  const [rateDecimalPlaces, setRateDecimalPlaces] = useState(6);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void (async () => {
      const current = await ensureSettings();
      setSettings(current);
      setPropertyName(current.propertyName);
      setRateDecimalPlaces(current.rateDecimalPlaces);
    })();
  }, []);

  async function saveSettings() {
    const next = await updateSettings({
      propertyName,
      rateDecimalPlaces,
    });
    setSettings(next);
    setStatus("Configurações salvas.");
  }

  async function handleExport() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `backup-contabilidade-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Backup exportado com sucesso.");
  }

  async function handleFileImport(file: File) {
    const text = await file.text();
    const parsed = parseBackupJson(text);
    if (!parsed.ok) {
      setStatus(parsed.error);
      return;
    }
    setPendingImport(parsed.data);
    setStatus(`Arquivo válido: ${summarizeBackup(parsed.data)}`);
  }

  async function confirmRestore() {
    if (!pendingImport) return;
    try {
      await restoreBackup(pendingImport);
      setStatus("Backup restaurado com sucesso.");
      setPendingImport(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível restaurar.");
    }
  }

  return (
    <section>
      <h2 className="page-title">Configurações</h2>
      <p className="lede">
        Ajustes gerais da propriedade e gestão de backup.
        {settings ? ` Atual: ${settings.propertyName}` : ""}
      </p>

      {status ? <div className="alert">{status}</div> : null}

      <div className="card">
        <h3>Dados da propriedade</h3>
        <div className="settings-grid">
          <label className="field">
            Nome da propriedade
            <input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
          </label>
          <label className="field">
            Casas decimais para taxas
            <input
              type="number"
              min={2}
              max={8}
              value={rateDecimalPlaces}
              onChange={(e) => setRateDecimalPlaces(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="row-actions">
          <button className="btn primary" type="button" onClick={() => void saveSettings()}>
            Salvar configurações
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Backup e restauração</h3>
        <div className="row-actions">
          <button className="btn ghost" type="button" onClick={() => void handleExport()}>
            Exportar backup
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Importar backup
          </button>
          {pendingImport ? (
            <button className="btn danger" type="button" onClick={() => void confirmRestore()}>
              Confirmar restauração
            </button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileImport(file);
          }}
        />
      </div>

      <div className="card">
        <h3>Dados de demonstração</h3>
        <div className="row-actions">
          <button className="btn ghost" type="button" onClick={() => void loadDemoData().then(() => setStatus("Dados de demonstração carregados."))}>
            Carregar demonstração
          </button>
          <button className="btn danger" type="button" onClick={() => void removeDemoData().then(() => setStatus("Dados de demonstração removidos."))}>
            Remover demonstração
          </button>
        </div>
      </div>
    </section>
  );
}
