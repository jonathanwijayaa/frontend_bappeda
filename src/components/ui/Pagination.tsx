import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    // Determine the start and end pages to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = startPage + 4;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - 4);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex gap-2 items-center">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed hidden sm:flex"
            >
                <ChevronLeft size={16} /> Sebelumnya
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="disabled:opacity-50 disabled:cursor-not-allowed sm:hidden"
            >
                <ChevronLeft size={16} />
            </Button>

            {startPage > 1 && <span className="px-1 py-1 text-gray-400">...</span>}

            {pages.map((page) => (
                <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="min-w-[40px] px-2"
                >
                    {page}
                </Button>
            ))}

            {endPage < totalPages && <span className="px-1 py-1 text-gray-400">...</span>}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed hidden sm:flex"
            >
                Selanjutnya <ChevronRight size={16} />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="disabled:opacity-50 disabled:cursor-not-allowed sm:hidden"
            >
                <ChevronRight size={16} />
            </Button>
        </div>
    );
};

export default Pagination;
