// src/components/ui/Table.tsx
import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor?: keyof T;
    width?: string;
    sortable?: boolean;
    sortKey?: string;
    render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    actions?: (row: T) => React.ReactNode;
    minRows?: number;
    sortColumn?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    onSort?: (columnKey: string) => void;
    actionsWidth?: string;
}

export function Table<T extends Record<string, any>>({
    columns,
    data,
    actions,
    minRows = 5,
    sortColumn,
    sortOrder,
    onSort,
    actionsWidth = "18%",
}: TableProps<T>) {
    const renderSortIcon = (colKey: string) => {
        if (sortColumn !== colKey || !sortOrder) {
            return <ArrowUpDown size={12} className="text-gray-400 group-hover:text-gray-600 transition-colors ml-1 inline shrink-0" />;
        }
        return sortOrder === 'asc' ? (
            <ArrowUp size={12} className="text-green-600 ml-1 inline shrink-0 font-bold" />
        ) : (
            <ArrowDown size={12} className="text-green-600 ml-1 inline shrink-0 font-bold" />
        );
    };

    return (
        <div className="overflow-x-auto w-full">
            {/* table-fixed mengunci lebar kolom agar stabil di setiap pagination */}
            <table className="w-full table-fixed text-left text-xs text-gray-700 border-collapse">
                <thead className="bg-gray-50/80 text-gray-400 font-bold tracking-wider">
                    <tr>
                        {columns.map((col, idx) => {
                            const key = (col.sortKey || col.accessor || '') as string;
                            const isSortable = col.sortable && key;

                            return (
                                <th
                                    key={idx}
                                    style={{ width: col.width }}
                                    onClick={() => isSortable && onSort && onSort(key)}
                                    className={`px-4 py-3.5 select-none ${isSortable ? 'cursor-pointer hover:text-gray-600 group transition-colors' : ''}`}
                                >
                                    <div className="flex items-center gap-1">
                                        <span className="truncate">{col.header}</span>
                                        {isSortable && renderSortIcon(key)}
                                    </div>
                                </th>
                            );
                        })}
                        {actions && (
                            <th 
                                style={{ width: actionsWidth }} 
                                className="px-4 py-3.5 text-center font-bold tracking-wider"
                            >
                                AKSI
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-gray-50/60 transition-colors">
                            {columns.map((col, colIdx) => (
                                <td key={colIdx} className="px-4 py-3.5 text-gray-800 align-middle">
                                    {col.render
                                        ? col.render(row)
                                        : col.accessor
                                        ? <span className="line-clamp-2 break-words">{String(row[col.accessor] ?? '-')}</span>
                                        : '-'}
                                </td>
                            ))}

                            {actions && (
                                <td className="px-4 py-3.5 text-center align-middle">
                                    <div className="flex items-center justify-center gap-2">
                                        {actions(row)}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {data.length < minRows &&
                        Array.from({ length: minRows - data.length }).map((_, idx) => (
                            <tr key={`empty-${idx}`} className="h-12">
                                <td colSpan={columns.length + (actions ? 1 : 0)} />
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;