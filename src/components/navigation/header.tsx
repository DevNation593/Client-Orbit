"use client";

import { Menu } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TenantSwitcher } from "./sidebar";
import { GlobalSearch } from "./global-search";
import { NotificationCenter } from "./notification-center";
import { CommandPalette } from "./command-palette";
import { QuickCreate } from "./quick-create";

export function Header({ onMenu }: { onMenu: () => void }) {
  const user = useAuthStore((state) => state.user);
  return (
    <header className="border-border bg-background/95 sticky top-0 z-20 flex h-[76px] items-center justify-between gap-3 border-b px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          aria-label="Abrir navegación"
          className="lg:hidden"
          size="icon"
          variant="ghost"
          onClick={onMenu}
        >
          <Menu size={20} />
        </Button>
        <GlobalSearch />
        <TenantSwitcher />
      </div>
      <div className="flex items-center gap-2">
        <CommandPalette />
        <QuickCreate />
        <NotificationCenter />
        <div className="border-border ml-1 flex items-center gap-2 border-l pl-3">
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-bold">
              {user?.name ?? "Usuario"}
            </span>
            <span className="text-muted block text-xs">Administrador</span>
          </span>
          <span className="text-brand-strong flex h-9 w-9 items-center justify-center rounded-full bg-[#dfe2ff] text-xs font-bold">
            {initials(user?.name)}
          </span>
        </div>
      </div>
    </header>
  );
}
