import React, { ReactNode } from 'react';

interface Column<T> {
    header: string;
    accessor?: keyof T;
    render?: (row: T) => ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    actions?: (row: T) => ReactNode;
    minRows?: number;
}

function Table<T extends Record<string, any>>({ columns, data, actions, minRows = 0 }: TableProps<T>) {
    // Calculate how many empty rows we need to add 
    const emptyRowsCount = Math.max(0, minRows - data.length);

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.header}
                            </th>
                        ))}
                        {actions && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                AKSI
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                            {columns.map((column, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                                    {column.render ? column.render(row) : column.accessor ? row[column.accessor] : ''}
                                </td>
                            ))}
                            {actions && (
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex gap-2">
                                        {actions(row)}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    {/* Empty placeholder rows to maintain consistent height */}
                    {Array.from({ length: emptyRowsCount }).map((_, index) => (
                        <tr key={`empty-${index}`} className="h-[57px]">
                            {columns.map((_, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                                    &nbsp;
                                </td>
                            ))}
                            {actions && (
                                <td className="px-6 py-4 text-sm">
                                    &nbsp;
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
