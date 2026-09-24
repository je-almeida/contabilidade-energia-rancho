"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ensureSettings } from "@/lib/repositories/settings";

const NAV = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/lancamento", label: "Lançamento mensal", icon: PlusIcon },
  { href: "/historico", label: "Histórico", icon: ClockIcon },
  { href: "/moradores", label: "Moradores", icon: PeopleIcon },
  { href: "/configuracoes", label: "Configurações", icon: GearIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [property, setProperty] = useState("Controle de energia e água");

  useEffect(() => {
    let active = true;
    void ensureSettings().then((s) => {
      if (active) setProperty(s.propertyName);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Energia e água</p>
          <h1>{property}</h1>
        </div>
      </header>
      <div className="shell-body">
        <nav className="sidenav" aria-label="Principal">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "nav-link active" : "nav-link"}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="content">{children}</main>
      </div>
      <nav className="bottomnav" aria-label="Principal">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "nav-link active" : "nav-link"}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.2 3 11h2v9h6v-6h2v6h6v-9h2L12 3.2Z"
      />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"
      />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v6l5 3 .9-1.5L13 12.2V7Z"
      />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 9 11Zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM9 13c-3.3 0-7 1.7-7 4v2h10v-2c0-2.3-3.7-4-7-4Zm8 0c-.4 0-.9 0-1.3.1 1.6 1.1 2.3 2.5 2.3 3.9V19h5v-2c0-2-3.1-4-6-4Z"
      />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="m19.4 13 .9-2-1.7-1 .2-1.9-2.1-.8-1.1-1.6-1.9.3L12.4 4h-2l-1.3 1.9-1.9-.3L6.1 7.2l-2.1.8.2 1.9-1.7 1 .9 2 1.6 1.1-.3 1.9 1.9 1.3.8 2.1 1.9-.2 1.1 1.7 2-.9 1.1-1.7 1.9.2.8-2.1 1.9-1.3-.3-1.9 1.6-1.1ZM11.4 15.2A3.2 3.2 0 1 1 14.6 12a3.2 3.2 0 0 1-3.2 3.2Z"
      />
    </svg>
  );
}
