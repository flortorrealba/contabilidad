import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cierre Contable | Cuadra Mayor, Balance y Auxiliares",
  description:
    "Sube el Mayor de tu cierre contable y valídalo contra el Balance y los Auxiliares de clientes y proveedores.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href={user ? "/empresas" : "/"} className="font-semibold text-neutral-900">
              📒 Cierre Contable
            </Link>
            {user ? (
              <div className="flex items-center gap-4 text-sm">
                <Link href="/cuenta" className="text-neutral-600 hover:text-neutral-900 hover:underline">
                  {user.nombre}
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="text-neutral-500 hover:text-neutral-900 hover:underline">
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
                >
                  Crear cuenta
                </Link>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
