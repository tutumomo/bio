import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import type { Gene } from "@/types";
import { SourceLinkButtons } from "./SourceLinkButtons";

const columnHelper = createColumnHelper<Gene>();

export function GeneTable({ genes }: { genes: Gene[] }) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      columnHelper.accessor("symbol", {
        header: "Gene Symbol",
        cell: (info) => (
          <span className="font-bold text-[#002045] cursor-pointer hover:text-blue-700">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("full_name", {
        header: "Product Protein",
        cell: (info) => <span className="text-sm text-slate-700">{info.getValue() ?? "N/A"}</span>,
      }),
      columnHelper.accessor("chromosome", {
        header: "Chromosome",
        cell: (info) => <span className="font-mono text-sm">{info.getValue() ?? "N/A"}</span>,
      }),
      columnHelper.accessor("length", {
        header: "Length (bp)",
        cell: (info) => {
          const val = info.getValue();
          return <span className="font-mono text-sm">{val ? val.toLocaleString() : "N/A"}</span>;
        },
      }),
      columnHelper.display({
        id: "source",
        header: "Source",
        cell: (info) => (
          <SourceLinkButtons
            links={[
              { label: "NCBI", url: info.row.original.ncbi_url },
              { label: "Ensembl", url: info.row.original.ensembl_url },
            ]}
          />
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: genes,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter table..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none hover:text-slate-700"
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
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/gene/${row.original.symbol}?ensembl_id=${row.original.ensembl_id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
