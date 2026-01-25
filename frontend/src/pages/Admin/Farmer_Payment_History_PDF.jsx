// PDF Export utility for Farmer Payment History
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";

export const exportFarmerPaymentPDF = (records, totalPayment) => {
  try {
    // Validate data
    if (!records || records.length === 0) {
      toast.error('No data available to export.');
      return;
    }

    // Create jsPDF instance
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Farmer Payment History', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Date
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Summary Cards Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Summary', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const summaryData = [
      ['Advanced Payment', `Rs ${totalPayment.advance_payment || 0}`],
      ['Received Payment', `Rs ${totalPayment.received_payment || 0}`],
      ['Total Pending Payment', `Rs ${totalPayment.total_pending_payment || 0}`],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [252, 208, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc.lastAutoTable?.finalY || yPosition) + 15;

    // Table Data
    if (records.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Farmer Payment Records', 14, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = records.map((row, index) => {
        return [
          `000${index + 1}`,
          row.week_start_date || 'N/A',
          row.week_end_date || 'N/A',
          row.full_name || 'N/A',
          row.status === 'Paid' ? 'Paid' : 'Pending',
          parseFloat(row.total_pure_quantity || 0).toFixed(2),
          parseFloat(row.total_cow_quantity || 0).toFixed(2),
          parseFloat(row.total_buffalo_quantity || 0).toFixed(2),
          `Rs ${parseFloat(row.total_amount || 0).toFixed(2)}`,
          `Rs ${parseFloat(row.paid_amount || 0).toFixed(2)}`,
          `Rs ${parseFloat(row.pending_amount || 0).toFixed(2)}`,
        ];
      });

      doc.autoTable({
        startY: yPosition,
        head: [[
          'Bill No.',
          'Start Date',
          'End Date',
          'Farmer Name',
          'Status',
          'Pure (ltr)',
          'Cow (ltr)',
          'Buffalo (ltr)',
          'Total Amount',
          'Paid Amount',
          'Pending Amount',
        ]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [252, 208, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 18 },
        },
      });
    } else {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('No payment records available.', 14, yPosition);
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleString("en-US")}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Generate filename
    const filename = `Farmer_Payment_History_${Date.now()}.pdf`;
    
    doc.save(filename);
    toast.success('PDF exported successfully!');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error(`Failed to export PDF: ${error.message || 'Unknown error'}`);
  }
};
