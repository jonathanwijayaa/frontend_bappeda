import type { ReactNode } from "react";

interface Column<T> {
  accessor?: keyof T;
  header: string;
  // e.g. '150px', '20%'
  noTruncate?: boolean;
  render?: (row: T) => ReactNode;
  width?: string; // set true for badge/action columns that shouldn't truncate
}

interface TableProps<T> {
  actions?: (row: T) => ReactNode;
  columns: Column<T>[];
  data: T[];
  highlightedRowId?: string | null;
  minRows?: number;
  rowIdAccessor?: keyof T;
}

function Table<T extends Record<string, unknown>>({
  actions,
  columns,
  data,
  highlightedRowId = null,
  minRows = 0,
  rowIdAccessor = "id" as keyof T,
}: TableProps<T>) {
  // Calculate how many empty rows we need to add
  const emptyRowsCount = Math.max(0, minRows - data.length);

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((column, index) => (
              <th
                key={index}
                style={column.width ? { width: column.width } : undefined}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider overflow-hidden"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[160px]">
                AKSI
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => {
            const rowId = String(row[rowIdAccessor]);
            const isHighlighted = highlightedRowId === rowId;

            return (
              <tr
                key={rowIndex}
                data-sk-id={rowId}
                className={`hover:bg-gray-50 transition-colors duration-300 ${
                  isHighlighted ? "bg-yellow-100 animate-pulse" : ""
                }`}
              >
                {columns.map((column, colIndex) => {
                  const rawValue = column.accessor ? String(row[column.accessor] ?? "") : "";
                  const content = column.render
                    ? column.render(row)
                    : column.accessor
                      ? row[column.accessor]
                      : "";
                  return (
                    <td key={colIndex} className="px-6 py-4 text-sm text-gray-900 overflow-hidden">
                      {column.noTruncate ? (
                        <div>{content}</div>
                      ) : (
                        <div className="truncate" title={!column.render ? rawValue : undefined}>
                          {content}
                        </div>
                      )}
                    </td>
                  );
                })}
                {actions && (
                  <td className="px-6 py-4 text-sm overflow-hidden">
                    <div className="flex gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            );
          })}
          {/* Empty placeholder rows to maintain consistent height */}
          {Array.from({ length: emptyRowsCount }).map((_, index) => (
            <tr key={`empty-${index}`} className="h-[57px]">
              {columns.map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                  &nbsp;
                </td>
              ))}
              {actions && <td className="px-6 py-4 text-sm">&nbsp;</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
