"use client";

import { useActionState, useEffect, useRef } from "react";
import { cambiarPasswordAction, type CambiarPasswordState } from "@/app/actions/auth";

const initialState: CambiarPasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="passwordActual" className="block text-sm font-medium text-neutral-700">
          Contraseña actual
        </label>
        <input
          id="passwordActual"
          name="passwordActual"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="passwordNueva" className="block text-sm font-medium text-neutral-700">
          Nueva contraseña
        </label>
        <input
          id="passwordNueva"
          name="passwordNueva"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-neutral-500">Mínimo 8 caracteres.</p>
      </div>
      <div>
        <label htmlFor="passwordConfirmacion" className="block text-sm font-medium text-neutral-700">
          Confirmar nueva contraseña
        </label>
        <input
          id="passwordConfirmacion"
          name="passwordConfirmacion"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">✅ Tu contraseña se actualizó correctamente.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
