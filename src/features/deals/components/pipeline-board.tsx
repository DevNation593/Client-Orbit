"use client";

import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Deal, Pipeline } from "@/types/domain";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { Avatar } from "@/components/common/avatar";
import { Button } from "@/components/ui/button";

export function PipelineBoard({
  pipeline,
  deals,
  onMove,
  onCreate,
}: {
  pipeline: Pipeline;
  deals: Deal[];
  onMove: (deal: Deal, stageId: number) => void;
  onCreate?: () => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  return (
    <div className="flex scrollbar-thin gap-4 overflow-x-auto pb-3">
      {[...pipeline.stages]
        .sort((a, b) => a.position - b.position)
        .map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage_id === stage.id);
          const stageValue = stageDeals.reduce(
            (sum, deal) => sum + Number(deal.value),
            0,
          );
          return (
            <section
              className="w-[286px] shrink-0 rounded-2xl bg-slate-100/80 p-3"
              key={stage.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                const deal = deals.find((entry) => entry.id === dragging);
                if (deal && deal.stage_id !== stage.id) onMove(deal, stage.id);
                setDragging(null);
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: stage.color ?? "#7374e8" }}
                    />
                    <h3 className="text-sm font-bold">{stage.name}</h3>
                    <span className="text-muted rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold">
                      {stageDeals.length}
                    </span>
                  </div>
                  <p className="text-muted mt-1 pl-4 text-xs">
                    {formatCurrency(stageValue)}
                  </p>
                </div>
                <Button
                  aria-label={`Opciones de ${stage.name}`}
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </div>
              <div className="space-y-2.5">
                {stageDeals.map((deal) => (
                  <article
                    className="border-border cursor-grab rounded-xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                    draggable
                    onDragEnd={() => setDragging(null)}
                    onDragStart={() => setDragging(deal.id)}
                    key={deal.id}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Link
                        className="hover:text-brand line-clamp-2 text-sm font-bold"
                        href={`/deals/${deal.id}`}
                      >
                        {deal.name}
                      </Link>
                      <GripVertical
                        className="shrink-0 text-slate-300"
                        size={15}
                      />
                    </div>
                    <p className="text-brand-strong text-sm font-bold">
                      {formatCurrency(deal.value, deal.currency)}
                    </p>
                    <div className="border-border mt-3 flex items-center justify-between border-t pt-2.5">
                      <span className="text-muted inline-flex items-center gap-1.5 text-[11px]">
                        <Avatar name={deal.owner?.name} size="sm" />
                        {deal.owner?.name ?? "Sin asignar"}
                      </span>
                      <span className="text-muted text-[11px]">
                        {formatRelativeDate(deal.expected_close_date)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              {onCreate ? (
                <Button
                  className="mt-3 w-full border-dashed"
                  size="sm"
                  variant="secondary"
                  onClick={onCreate}
                >
                  <Plus size={14} />
                  Añadir oportunidad
                </Button>
              ) : null}
            </section>
          );
        })}
    </div>
  );
}
