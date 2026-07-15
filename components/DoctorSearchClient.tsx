"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/DashboardShell";
import { DoctorCard } from "@/components/DoctorCard";
import { Pills } from "@/components/Tabs";
import { Button } from "@/components/ui";
import { searchDoctorsAction } from "@/lib/actions/data";
import type { Doctor, Specialty } from "@/lib/data";

const modeOptions = ["Video", "Audio", "Chat", "In-person"];
const sortOptions = ["Top rated", "Lowest price", "Most experienced", "Soonest available"];
const PAGE = 9;

export function DoctorSearchClient({
  specialties,
  initialDoctors,
  initialTotal,
  initialQuery,
  initialSpecialty,
}: {
  specialties: Specialty[];
  initialDoctors: Doctor[];
  initialTotal: number;
  initialQuery: string;
  initialSpecialty: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [spec, setSpec] = useState<string[]>(initialSpecialty ? [initialSpecialty] : []);
  const [modes, setModes] = useState<string[]>([]);
  const [maxFee, setMaxFee] = useState(80);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("Top rated");

  const [results, setResults] = useState<Doctor[]>(initialDoctors);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Monotonic id so a slow/stale response can't overwrite a newer query's result.
  const reqId = useRef(0);
  const firstRun = useRef(true);

  function filters() {
    return {
      q: query.trim() || undefined,
      specialties: spec.length ? spec : undefined,
      modes: modes.length ? modes : undefined,
      maxFee,
      minRating: minRating || undefined,
      sort,
      limit: PAGE,
    };
  }

  // Refetch page 0 whenever a filter changes (debounced). SSR already rendered
  // the initial state, so the very first run is skipped.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const page = await searchDoctorsAction({ ...filters(), offset: 0 });
      if (id !== reqId.current) return; // a newer query superseded this one
      setResults(page.doctors);
      setTotal(page.total);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, spec, modes, maxFee, minRating, sort]);

  async function loadMore() {
    const id = reqId.current;
    setLoadingMore(true);
    const page = await searchDoctorsAction({ ...filters(), offset: results.length });
    setLoadingMore(false);
    if (id !== reqId.current) return; // filters changed mid-load — discard
    setResults((prev) => [...prev, ...page.doctors]);
    setTotal(page.total);
  }

  function reset() {
    setQuery("");
    setSpec([]);
    setModes([]);
    setMaxFee(80);
    setMinRating(0);
  }

  return (
    <>
      <PageHeader
        title="Find a doctor"
        subtitle={`${total} verified specialist${total === 1 ? "" : "s"} ready to help`}
      />

      {/* Search bar */}
      <div className="mb-6 flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white p-1.5">
        <span className="pl-3 text-mute">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symptom, specialty or doctor"
          className="min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:text-mute"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="space-y-6">
          <div className="card-flat p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filters</h3>
              <button onClick={reset} className="text-xs text-ps hover:underline">
                Reset
              </button>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Specialty</p>
              <Pills
                options={specialties.slice(0, 8).map((s) => s.name)}
                value={spec}
                onChange={setSpec}
                multi
              />
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Consultation type</p>
              <Pills options={modeOptions} value={modes} onChange={setModes} multi />
            </div>

            <div className="mt-5">
              <p className="mb-2 flex items-center justify-between text-sm font-medium">
                Max fee <span className="text-ps">${maxFee}</span>
              </p>
              <input
                type="range"
                min={20}
                max={80}
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                className="w-full accent-[#0070d1]"
              />
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium">Minimum rating</p>
              <div className="flex gap-2">
                {[0, 4, 4.5, 4.8].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`chip ${minRating === r ? "chip-active" : ""}`}
                  >
                    {r === 0 ? "Any" : `${r}★+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-mute">
              {loading ? "Searching…" : `${total} doctor${total === 1 ? "" : "s"}`}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-mute">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full border border-[#e2e2e2] bg-white px-3 py-1.5 text-sm outline-none"
              >
                {sortOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </div>

          {results.length === 0 && !loading ? (
            <div className="card-flat p-12 text-center">
              <p className="text-3xl">🔍</p>
              <p className="mt-3 font-display text-xl font-light">No doctors match your filters</p>
              <button onClick={reset} className="mt-4 btn btn-primary btn-sm">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
                {results.map((d) => (
                  <DoctorCard key={d.id} doctor={d} />
                ))}
              </div>

              {results.length < total && (
                <div className="mt-8 text-center">
                  <Button variant="light" onClick={loadMore} loading={loadingMore} disabled={loadingMore}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
