"use client";

import { useActionState } from "react";
import { createEmpresaAction } from "@/app/actions/empresas";
import type { ActionState } from "@/app/actions/auth";

const initialState: ActionState = {};

export function CreateEmpresaForm() {
  const [state, formAction, pending] = useActionState(createEmpresaAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700">
          Nombre de la empresa
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          className="mt-1 w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="rut" className="block text-sm font-medium text-neutral-700">
          RUT (opcional)
        </label>
        <input
          id="rut"
          name="rut"
          type="text"
          className="mt-1 w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear empresa"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
