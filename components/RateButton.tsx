"use client";

import { useState } from "react";
import { Button } from "./ui";

export function RateButton({ doctorName }: { doctorName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <button className="btn btn-light btn-sm" onClick={() => setOpen(true)}>
        Rate doctor
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="text-center">
                <p className="text-4xl">🎉</p>
                <h3 className="mt-3 font-display text-2xl font-light">Thank you!</h3>
                <p className="mt-1 text-mute">Your feedback helps other patients.</p>
                <Button className="mt-5" onClick={() => setOpen(false)}>Done</Button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl font-light tracking-tight">Rate your visit</h3>
                <p className="mt-1 text-sm text-mute">How was your consultation with {doctorName}?</p>
                <div className="mt-5 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className="text-4xl transition-transform hover:scale-110"
                      style={{ color: s <= rating ? "#f5a623" : "#d8dde3" }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  placeholder="Share a few words (optional)…"
                  className="field mt-5"
                />
                <div className="mt-5 flex gap-2">
                  <Button variant="light" className="flex-1" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={rating === 0}
                    onClick={() => setSubmitted(true)}
                  >
                    Submit
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
