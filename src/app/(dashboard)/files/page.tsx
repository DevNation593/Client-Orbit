"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { crmApi } from "@/lib/api/resources";
import type { FileRecord } from "@/types/domain";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/common/page-header";
import { FileDropzone } from "@/components/common/file-dropzone";
import { ErrorState, EmptyState } from "@/components/common/async-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FilesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [removeId, setRemoveId] = useState<number | null>(null);
  const client = useQueryClient();
  const files = useQuery({
    queryKey: ["files"],
    queryFn: () => crmApi.files.list({ page: 1, per_page: 50 }),
  });
  const upload = useMutation({
    mutationFn: (selected: File) => {
      const body = new FormData();
      body.append("file", selected);
      return crmApi.files.upload(body);
    },
    onSuccess: () => {
      setFile(null);
      return client.invalidateQueries({ queryKey: ["files"] });
    },
  });
  const remove = useMutation({
    mutationFn: crmApi.files.remove,
    onSuccess: () => client.invalidateQueries({ queryKey: ["files"] }),
  });
  const download = async (item: FileRecord) => {
    const result = await crmApi.files.download(item.id);
    window.open(result.url, "_blank", "noopener,noreferrer");
  };
  return (
    <>
      <PageHeader
        eyebrow="Operación"
        title="Archivos"
        description="Gestiona documentos del tenant con URLs temporales y sin exponer credenciales de almacenamiento."
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subir archivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropzone
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp"
            file={file}
            onFile={setFile}
          />
          <div className="flex justify-end">
            <Button
              disabled={!file || upload.isPending}
              onClick={() => {
                if (file) void upload.mutateAsync(file);
              }}
            >
              {upload.isPending ? "Subiendo…" : "Subir archivo"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {files.isError ? (
        <ErrorState onRetry={() => void files.refetch()} />
      ) : files.data?.items.length ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-border divide-y">
              {files.data.items.map((item) => (
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  key={item.id}
                >
                  <span className="bg-brand-soft text-brand flex h-9 w-9 items-center justify-center rounded-xl">
                    <FileText size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {item.filename}
                    </p>
                    <p className="text-muted mt-0.5 text-xs">
                      {item.mime_type ?? "Archivo"} ·{" "}
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <Button
                    aria-label={`Descargar ${item.filename}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => void download(item)}
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    aria-label={`Eliminar ${item.filename}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => setRemoveId(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <MoreHorizontal
                    className="text-muted hidden sm:block"
                    size={16}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description="Sube un documento para verlo disponible en tu espacio."
          title="No hay archivos"
        />
      )}
      <ConfirmDialog
        description="Se eliminará el archivo del almacenamiento y del registro del tenant."
        loading={remove.isPending}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId)
            void remove.mutateAsync(removeId).then(() => setRemoveId(null));
        }}
        open={removeId !== null}
        title="Eliminar archivo"
      />
    </>
  );
}
