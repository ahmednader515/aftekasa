export type HomeworkMaterialType = "pdf" | "image";

export type HomeworkMaterial = {
  url: string;
  fileName: string;
  type: HomeworkMaterialType;
};

export function parseHomeworkMaterials(raw: unknown): HomeworkMaterial[] {
  if (raw == null) return [];
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      parsed = JSON.parse(s);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const out: HomeworkMaterial[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const url = String(row.url ?? "").trim();
    if (!url) continue;
    const typeRaw = String(row.type ?? "").toLowerCase();
    const type: HomeworkMaterialType = typeRaw === "image" ? "image" : "pdf";
    const fileName = String(row.fileName ?? row.file_name ?? "").trim() || (type === "image" ? "صورة" : "ملف PDF");
    out.push({ url, fileName, type });
  }
  return out;
}

export function serializeHomeworkMaterials(materials: HomeworkMaterial[] | null | undefined): string | null {
  if (!materials?.length) return null;
  return JSON.stringify(
    materials.map((m) => ({
      url: m.url,
      fileName: m.fileName,
      type: m.type === "image" ? "image" : "pdf",
    })),
  );
}
