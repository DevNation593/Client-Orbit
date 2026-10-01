"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isSettingsHome = pathname === "/settings";

  return (
    <>
      <Link
        className={buttonVariants({ variant: "secondary", size: "sm" })}
        href={isSettingsHome ? "/" : "/settings"}
      >
        <ArrowLeft size={15} />
        {isSettingsHome ? "Volver al inicio" : "Volver a configuración"}
      </Link>
      <div className="mt-4">{children}</div>
    </>
  );
}
