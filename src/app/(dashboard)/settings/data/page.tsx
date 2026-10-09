"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import {
  ExportBatchStatus,
  ImportBatchStatus,
} from "@/features/data-jobs/batch-status";
import { crmApi } from "@/lib/api/resources";
import type { ExportBatch, ImportBatch } from "@/types/domain";
import { PageHeader } from "@/components/common/page-header";
import { FileDropzone } from "@/components/common/file-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function DataOperationsPage() {
  const [entityType, setEntityType] = useState("contacts");
  const [file, setFile] = useState<File | null>(null);
  const [importBatch, setImportBatch] = useState<ImportBatch | null>(null);
  const [exportBatch, setExportBatch] = useState<ExportBatch | null>(null);
  const [busy, setBusy] = useState<"import" | "export" | null>(null);
  const importFile = async () => {
    if (!file) return;
    setBusy("import");
    try {
      const body = new FormData();
      body.append("entity_type", entityType);
      body.append("file", file);
      setImportBatch(await crmApi.imports.create(body));
      setFile(null);
    } finally {
      setBusy(null);
    }
  };
  const startExport = async () => {
    setBusy("export");
    try {
      setExportBatch(await crmApi.exports.create({ entity_type: entityType }));
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Operaciones"
        title="Importar y exportar"
        description="Carga información tabular con validación y solicita exportaciones procesadas por Laravel."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="bg-brand-soft text-brand flex h-10 w-10 items-center justify-center rounded-xl">
                <ArrowUpFromLine size={19} />
              </span>
              <CardTitle>Importar datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              aria-label="Entidad a importar"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            >
              <option value="contacts">Contactos</option>
              <option value="organizations">Organizaciones</option>
              <option value="leads">Leads</option>
            </Select>
            <FileDropzone
              accept=".csv,.txt,.xlsx"
              file={file}
              onFile={setFile}
            />
            <Button
              className="w-full"
              disabled={!file || busy !== null}
              onClick={() => void importFile()}
            >
              {busy === "import"
                ? "Enviando a procesamiento…"
                : "Procesar importación"}
            </Button>
            {importBatch ? (
              <ImportBatchStatus batch={importBatch} key={importBatch.id} />
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ArrowDownToLine size={19} />
              </span>
              <CardTitle>Exportar datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              aria-label="Entidad a exportar"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
            >
              <option value="contacts">Contactos</option>
              <option value="organizations">Organizaciones</option>
              <option value="leads">Leads</option>
              <option value="deals">Oportunidades</option>
              <option value="tasks">Tareas</option>
            </Select>
            <div className="bg-surface-subtle text-muted rounded-xl p-4 text-sm leading-6">
              La exportación será generada por el backend y estará disponible
              cuando el lote termine. No se descargan datos directamente desde
              el navegador.
            </div>
            <Button
              className="w-full"
              disabled={busy !== null}
              variant="secondary"
              onClick={() => void startExport()}
            >
              {busy === "export" ? "Solicitando…" : "Solicitar exportación"}
            </Button>
            {exportBatch ? (
              <ExportBatchStatus batch={exportBatch} key={exportBatch.id} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
