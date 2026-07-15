import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmpresaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id: empresaId } = await params;
  const membership = await prisma.empresaMember.findUnique({
    where: { userId_empresaId: { userId: user.id, empresaId } },
    include: { empresa: true },
  });
  if (!membership) notFound();

  const tabs = [
    { href: `/empresas/${empresaId}/cierres`, label: "Cierres" },
    { href: `/empresas/${empresaId}/cuentas`, label: "Plan de cuentas" },
    { href: `/empresas/${empresaId}/miembros`, label: "Miembros" },
    { href: `/empresas/${empresaId}/configuracion`, label: "Configuración" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/empresas" className="text-sm text-neutral-500 hover:underline">
          ← Todas las empresas
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">{membership.empresa.nombre}</h1>
        {membership.empresa.rut && <p className="text-sm text-neutral-500">{membership.empresa.rut}</p>}
      </div>
      <nav className="flex gap-1 border-b border-neutral-200">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-t-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
