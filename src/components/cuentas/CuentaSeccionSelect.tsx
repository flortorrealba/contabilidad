"use client";

import { useRef, useTransition } from "react";
import { updateCuentaSeccionAction } from "@/app/actions/cuentas";
import { SECCIONES_PL, SECCION_PL_LABEL, type SeccionPL } from "@/lib/pl-secciones";

const OPCIONES: SeccionPL[] = ["NONE", ...SECCIONES_PL];

export function CuentaSeccionSelect({
  empresaId,
  cuentaId,
  seccionPL,
}: {
  empresaId: string;
  cuentaId: string;
  seccionPL: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => updateCuentaSeccionAction(formData))}
    >
      <input type="hidden" name="empresaId" value={empresaId} />
      <input type="hidden" name="cuentaId" value={cuentaId} />
      <select
        name="seccionPL"
        defaultValue={seccionPL}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none disabled:opacity-50"
      >
        {OPCIONES.map((op) => (
          <option key={op} value={op}>
            {SECCION_PL_LABEL[op]}
          </option>
        ))}
      </select>
    </form>
  );
}
