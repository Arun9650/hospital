"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { uploadMedicalRecord } from "@/lib/actions/records";

const TYPES = ["Lab Report", "Prescription", "Scan", "Discharge Summary", "Vaccination"];

/* Upload a medical record file. Opens a small dialog (title + type + file),
   posts a FormData to the server action, then refreshes so the new row shows. */
export function UploadRecordButton() {
  const router = useRouter();
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = await uploadMedicalRecord(new FormData(e.currentTarget));
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      formRef.current?.reset();
      show("Record uploaded", "success");
      router.refresh();
    } else {
      show(res.error || "Couldn't upload the record", "error");
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Upload record</Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Upload medical record"
          onClick={(e) => { if (e.target === e.currentTarget && !busy) setOpen(false); }}
        >
          <form ref={formRef} onSubmit={submit} className="card-flat w-full max-w-md space-y-4 p-6">
            <h2 className="font-display text-xl font-normal">Upload a record</h2>
            <Field label="Title" hint="e.g. Complete blood count">
              <input name="title" className="field" placeholder="Document title" maxLength={120} />
            </Field>
            <Field label="Type">
              <select name="type" className="field" defaultValue="Lab Report">
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="File" hint="PDF or image, up to 15 MB.">
              <input
                name="file"
                type="file"
                required
                accept=".pdf,image/*"
                className="field file:mr-3 file:rounded-full file:border-0 file:bg-surface-card file:px-3 file:py-1 file:text-sm"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="light" size="sm" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={busy}>
                Upload
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
