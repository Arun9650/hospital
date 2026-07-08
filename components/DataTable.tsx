import { ReactNode } from "react";

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="card-flat overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-card text-left text-xs uppercase tracking-wide text-mute">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-5 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f2]">
            {rows.map((r, i) => (
              <tr key={i} className="transition-colors hover:bg-[#f9fbfd]">
                {r.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-5 py-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
