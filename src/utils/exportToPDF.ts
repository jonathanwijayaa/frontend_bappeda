import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportColumn {
    header: string;
    dataKey: string;
}

interface ExportOptions {
    title: string;
    columns: ExportColumn[];
    data: any[];
    filename?: string;
}

/**
 * Export data to PDF with formatted table
 * @param options - Export configuration options
 */
export const exportToPDF = (options: ExportOptions): void => {
    try {
        const { title, columns, data, filename = 'export.pdf' } = options;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Add title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 15);

        // Add date and time
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const now = new Date();
        const currentDate = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentTime = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        doc.text(`Tanggal: ${currentDate}, ${currentTime}`, 14, 22);

        // Generate table
        autoTable(doc, {
            startY: 28,
            head: [columns.map(col => col.header)],
            body: data.map(row =>
                columns.map(col => row[col.dataKey] || '-')
            ),
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [59, 130, 246], // Blue color
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            margin: { top: 28, left: 14, right: 14 },
            didDrawPage: (data) => {
                // Footer with page number
                const pageCount = doc.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(128);
                doc.text(
                    `Halaman ${data.pageNumber} dari ${pageCount}`,
                    doc.internal.pageSize.width / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }
        });

        // Save the PDF
        doc.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Gagal mengekspor data ke PDF');
    }
};
