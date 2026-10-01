"use client";

import { Link2 } from "lucide-react";
import type { ID } from "@/types/domain";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface RelationOption {
  id: ID;
  label: string;
  subtitle?: string;
}

export function RelationPicker({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecciona un registro",
}: {
  label: string;
  value?: ID | "";
  options: RelationOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>
        <span className="inline-flex items-center gap-1.5">
          <Link2 size={14} className="text-brand" />
          {label}
        </span>
      </Label>
      <Select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.subtitle ? ` · ${option.subtitle}` : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
