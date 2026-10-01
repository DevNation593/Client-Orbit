import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-white/80 bg-white/90">
      <CardContent className="p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted mt-2 text-sm leading-6">{description}</p>
        <div className="mt-7">{children}</div>
      </CardContent>
    </Card>
  );
}
