/**
 * Client-side utility to export JSON arrays to downloadable CSV files.
 */
export function exportToCSV<T extends Record<string, string | number | boolean | null | undefined>>(
  data: T[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(headers.join(","));

  // Content rows
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      const escaped = val === null || val === undefined 
        ? "" 
        : String(val).replace(/"/g, '""');
      
      // If the string contains a comma or quotes, wrap it in double quotes
      return escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")
        ? `"${escaped}"`
        : escaped;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
