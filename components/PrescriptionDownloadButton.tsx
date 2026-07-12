"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { downloadPrescriptionPdf } from "@/lib/prescriptionPdf";
import type { Prescription } from "@/lib/data";

/* One-click PDF download of a saved prescription (patient's Prescriptions page). */
export function PrescriptionDownloadButton({
  rx,
  patientName,
}: {
  rx: Prescription;
  patientName?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      await downloadPrescriptionPdf(rx, patientName);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="light" size="sm" loading={busy} onClick={download}>
      Download PDF
    </Button>
  );
}
