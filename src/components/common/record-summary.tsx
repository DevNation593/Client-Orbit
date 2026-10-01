import { ArrowUpRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/common/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function RecordSummary({
  name,
  subtitle,
  email,
  phone,
  action,
  children,
}: {
  name: string;
  subtitle?: string;
  email?: string | null;
  phone?: string | null;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div>
            <h2 className="text-xl font-bold">{name}</h2>
            {subtitle ? (
              <p className="text-muted mt-1 text-sm">{subtitle}</p>
            ) : null}
            <div className="text-muted mt-2 flex flex-wrap gap-3 text-xs">
              {email ? (
                <a
                  className="hover:text-brand inline-flex items-center gap-1.5"
                  href={`mailto:${email}`}
                >
                  <Mail size={13} />
                  {email}
                </a>
              ) : null}
              {phone ? (
                <a
                  className="hover:text-brand inline-flex items-center gap-1.5"
                  href={`tel:${phone}`}
                >
                  <Phone size={13} />
                  {phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {children}
          {action ?? (
            <Link
              className="text-brand inline-flex items-center gap-1 text-sm font-semibold"
              href="#activity"
            >
              Ver actividad <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
