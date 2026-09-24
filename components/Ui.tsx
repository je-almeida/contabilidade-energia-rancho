import type { ReactNode } from "react";
import { statusLabel } from "@/lib/format";

export function AutoLabel({ children }: { children: ReactNode }) {
  return (
    <span className="auto-label">
      {children} <em>(automático)</em>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}

export function ConfirmBar({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="row-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Voltar
          </button>
          <button
            type="button"
            className={danger ? "btn danger" : "btn primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
