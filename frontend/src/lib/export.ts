export function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTSV(headers: string[], rows: string[][], filename: string) {
  const tsvContent = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
  const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
