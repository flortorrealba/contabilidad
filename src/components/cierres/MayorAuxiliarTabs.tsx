"use client";

import { useState } from "react";

export function MayorAuxiliarTabs({
  mayor,
  auxiliar,
}: {
  mayor: React.ReactNode;
  auxiliar: React.ReactNode | null;
}) {
  const [tab, setTab] = useState<"mayor" | "auxiliar">(auxiliar ? "auxiliar" : "mayor");

  if (!auxiliar) return <div className="mt-4">{mayor}</div>;

  return (
    <div className="mt-4">
      <div className="flex gap-1 border-b border-neutral-200">
        <button
          onClick={() => setTab("auxiliar")}
          className={
            "rounded-t-md px-4 py-2 text-sm font-medium " +
            (tab === "auxiliar"
              ? "border border-b-0 border-neutral-200 bg-white text-neutral-900"
              : "text-neutral-500 hover:text-neutral-900")
          }
        >
          Auxiliar (por cliente/proveedor/persona)
        </button>
        <button
          onClick={() => setTab("mayor")}
          className={
            "rounded-t-md px-4 py-2 text-sm font-medium " +
            (tab === "mayor"
              ? "border border-b-0 border-neutral-200 bg-white text-neutral-900"
              : "text-neutral-500 hover:text-neutral-900")
          }
        >
          Mayor (todos los movimientos)
        </button>
      </div>
      <div className={tab === "mayor" ? "mt-4 block" : "hidden"}>{mayor}</div>
      <div className={tab === "auxiliar" ? "mt-4 block" : "hidden"}>{auxiliar}</div>
    </div>
  );
}
