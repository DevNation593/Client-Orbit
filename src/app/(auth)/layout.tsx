import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f3ff] px-4 py-10">
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#dfe1ff] blur-3xl" />
      <div className="absolute -right-16 -bottom-28 h-96 w-96 rounded-full bg-[#e8e6ff] blur-3xl" />
      <div className="relative w-full max-w-[440px]">
        <Link
          className="mb-8 flex items-center justify-center gap-2.5 text-xl font-extrabold tracking-tight"
          href="/"
        >
          <span className="bg-brand flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white">
            V
          </span>
          Vantex<span className="text-brand"> CRM</span>
        </Link>
        {children}
        <p className="text-muted mt-7 text-center text-xs">
          Vantex CRM · Plataforma multiindustria configurable
        </p>
      </div>
    </main>
  );
}
