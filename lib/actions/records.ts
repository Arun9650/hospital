"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { firstError, maxLen, oneOf } from "@/lib/validate";

const RECORD_TYPES = [
  "Lab Report",
  "Prescription",
  "Scan",
  "Discharge Summary",
  "Vaccination",
] as const;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB, matching in-call file sharing.

/** Human-readable file size, e.g. 1536 → "1.5 KB". */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/* Patient uploads a medical record file → Supabase Storage + a medical_records
   row. Trust-boundary validated. Needs the backend (Storage), so it reports a
   clear error in mock mode rather than pretending to persist. */
export async function uploadMedicalRecord(
  form: FormData
): Promise<{ ok: boolean; error?: string }> {
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const type = String(form.get("type") ?? "Lab Report");

  // Validate before any upload.
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File is too large (max 15 MB)." };
  }
  const bad = firstError(maxLen(title, 120, "Title"), oneOf(type, RECORD_TYPES, "Type"));
  if (bad) return { ok: false, error: bad };

  if (!isSupabaseConfigured) {
    return { ok: false, error: "Uploading records needs the connected backend." };
  }

  try {
    const sb = await createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user?.id) return { ok: false, error: "Please sign in to upload records." };

    // First path segment MUST be the user id — the storage insert policy enforces it.
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await sb.storage
      .from("medical-records")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      console.error("[records] upload failed", { message: upErr.message });
      return { ok: false, error: "Couldn't upload the file. Please try again." };
    }

    // Private bucket (0011): store only the path. Signed URLs are minted per
    // read in lib/db.getMedicalRecords — no public URL is persisted.
    const meta = user.user_metadata ?? {};
    const { error: insErr } = await sb.from("medical_records").insert({
      id: crypto.randomUUID(),
      patient_id: user.id,
      title: title || file.name,
      type,
      date_label: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      issued_by: (meta.full_name as string) || "You",
      size: formatBytes(file.size),
      file_path: path,
    });
    if (insErr) {
      console.error("[records] insert failed", { message: insErr.message, code: insErr.code });
      return { ok: false, error: "Couldn't save the record. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[records] unexpected error", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
