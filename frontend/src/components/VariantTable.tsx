import { useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Variant } from "@/types";
import { ImpactBadge } from "./ImpactBadge";
import { CaddScoreBar } from "./CaddScoreBar";
import { SourceLinkButtons } from "./SourceLinkButtons";
import { exportCSV } from "@/lib/export";

const columnHelper = createColumnHelper<Variant>();

export function VariantTable({ variants }: { variants: Variant[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleExportCSV = () => {
    const headers = ["RSID", "Gene", "Consequence", "Impact", "CADD", "GERP++", "RegulomeDB"];
    const rows = variants.map((v) => [
      v.rsid || "N/A",
      v.gene_symbol || "N/A",
      v.consequence ?? "N/A",
      v.impact ?? "N/A",
      v.cadd_score?.toString() ?? "N/A",
      v.gerp_score?.toString() ?? "N/A",
      v.regulome_rank ?? "N/A",
    ]);
    const geneSymbol = variants[0]?.gene_symbol ?? "gene";
    exportCSV(headers, rows, `variant_annotations_${geneSymbol}.csv`);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("gene_symbol", {
        header: "Gene",
        cell: (info) => <span className="font-bold text-[#002045] text-sm">{info.getValue() ?? "N/A"}</span>,
        size: 80,
      }),
      columnHelper.accessor("rsid", {
        header: "SNP",
        cell: (info) => <span className="font-mono text-sm text-blue-700">{info.getValue()}</span>,
        size: 120,
      }),
      columnHelper.accessor("consequence", {
        header: "Consequence",
        cell: (info) => (
          <span className="text-xs text-slate-700">{info.getValue()?.replace(/_/g, " ") ?? "N/A"}</span>
        ),
        size: 150,
      }),
      columnHelper.accessor("impact", {
        header: "Impact",
        cell: (info) => <ImpactBadge impact={info.getValue()} />,
        size: 100,
      }),
      columnHelper.accessor("cadd_score", {
        header: "CADD",
        cell: (info) => <CaddScoreBar score={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor("gerp_score", {
        header: "GERP++",
        cell: (info) => {
          const v = info.getValue();
          return <span className="font-mono text-sm">{v !== null ? v.toFixed(2) : "N/A"}</span>;
        },
        size: 80,
      }),
      columnHelper.accessor("regulome_rank", {
        header: "RegulomeDB",
        cell: (info) => <span className="font-mono text-sm">{info.getValue() ?? "N/A"}</span>,
        size: 100,
      }),
      columnHelper.display({
        id: "source",
        header: "Source",
        cell: (info) => (
          <SourceLinkButtons
            links={[
              { label: "dbSNP", url: info.row.original.dbsnp_url },
              { label: "VEP", url: info.row.original.ensembl_vep_url },
            ]}
          />
        ),
        size: 150,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: variants,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 20,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div ref={tableContainerRef} className="overflow-auto max-h-[600px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none hover:text-slate-700 bg-slate-50"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isHighImpact = row.original.impact === "HIGH";
              const isHighCadd = (row.original.cadd_score ?? 0) >= 25;
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={(node) => virtualizer.measureElement(node)}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 ${
                    isHighImpact ? "bg-red-50" : isHighCadd ? "bg-orange-50/20" : ""
                  }`}
                  style={{
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: "100%",
                    display: "table-row",
                  }}
                  onClick={() =>
                    setExpandedRow(expandedRow === row.original.rsid ? null : row.original.rsid)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-t border-slate-100 flex justify-between items-center">
        <span>Showing {variants.length} variants</span>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download CSV
        </button>
      </div>
    </div>
  );
}
