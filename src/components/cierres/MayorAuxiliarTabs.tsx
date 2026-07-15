"use client";

import { useState } from "react";

export function MayorAuxiliarTabs({
  mayor,
  auxiliar,
  validacion,
}: {
  mayor: React.ReactNode;
  auxiliar: React.ReactNode | null;
  validacion?: React.ReactNode | null;
}) {
  const [tab, setTab] = useState<"mayor" | "auxiliar" | "validacion">(auxiliar ? "auxiliar" : "mayor");

  if (!auxiliar) return <div className="mt-4">{mayor}</div>;

  const tabs = [
    { id: "auxiliar" as const, label: "Auxiliar (por cliente/proveedor/persona)" },
    { id: "mayor" as const, label: "Mayor (todos los movimientos)" },
    ...(validacion ? [{ id: "validacion" as const, label: "Validar contra iContador" }] : []),
  ];

  return (
    <div className="mt-4">
      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "rounded-t-md px-4 py-2 text-sm font-medium " +
              (tab === t.id
                ? "border border-b-0 border-neutral-200 bg-white text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={tab === "mayor" ? "mt-4 block" : "hidden"}>{mayor}</div>
      <div className={tab === "auxiliar" ? "mt-4 block" : "hidden"}>{auxiliar}</div>
      {validacion && <div className={tab === "validacion" ? "mt-4 block" : "hidden"}>{validacion}</div>}
    </div>
  );
}
