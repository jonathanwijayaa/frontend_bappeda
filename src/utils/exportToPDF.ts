import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportColumn {
  dataKey: string;
  header: string;
}

interface ExportOptions {
  columns: ExportColumn[];
  data: unknown[];
  filename?: string;
  title: string;
}

/**
 * Export data to PDF with formatted table
 * @param options - Export configuration options
 */
export const exportToPDF = (options: ExportOptions): void => {
  try {
    const { columns, data, filename = "export.pdf", title } = options;

    const doc = new jsPDF({
      format: "a4",
      orientation: "landscape",
      unit: "mm",
    });

    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 15);

    // Add date and time
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const now = new Date();
    const currentDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      weekday: "long",
      year: "numeric",
    });
    const currentTime = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    });
    doc.text(`Tanggal: ${currentDate}, ${currentTime}`, 14, 22);

    // Generate table
    autoTable(doc, {
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      body: data.map((row) => columns.map((col) => row[col.dataKey] || "-")),
      didDrawPage: (data) => {
        // Footer with page number
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Halaman ${data.pageNumber} dari ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" },
        );
      },
      head: [columns.map((col) => col.header)],
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        fontStyle: "bold",
        halign: "center",
        textColor: [255, 255, 255],
      },
      margin: { left: 14, right: 14, top: 28 },
      startY: 28,
      styles: {
        cellPadding: 3,
        fontSize: 9,
      },
    });

    // Save the PDF
    doc.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Gagal mengekspor data ke PDF");
  }
};
