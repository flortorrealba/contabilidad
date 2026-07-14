"use client";

import { useActionState } from "react";
import { uploadCierreAction } from "@/app/actions/cierres";
import type { ActionState } from "@/app/actions/auth";

const initialState: ActionState = {};

export function UploadCierreForm({ empresaId }: { empresaId: string }) {
  const action = uploadCierreAction.bind(null, empresaId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700">
          Nombre del cierre (opcional)
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          placeholder="Ej: Enero a Junio 2026"
          className="mt-1 w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="archivo" className="block text-sm font-medium text-neutral-700">
          Libro diario (.xlsx, .xlsm o .csv)
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          accept=".xlsx,.xlsm,.xls,.csv"
          required
          className="mt-1 block w-full max-w-md text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-700"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Debe incluir columnas de Fecha, Cuenta, Debe y Haber (como el libro diario tributario).
        </p>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Procesando…" : "Subir y procesar"}
      </button>
    </form>
  );
}
