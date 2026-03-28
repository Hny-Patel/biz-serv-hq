import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfInvoice {
  invoiceNumber: string;
  companyName: string;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  dueDate?: string | null;
  createdAt: string;
  items: { description: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  taxName?: string;
  taxRate?: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  termsAndConditions?: string | null;
  status?: string;
  currencySymbol?: string;
}

export function generateInvoicePdf(inv: PdfInvoice) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const cs = inv.currencySymbol ?? "₹";

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(inv.companyName, 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  let y = 28;
  if (inv.companyEmail) { doc.text(inv.companyEmail, 14, y); y += 5; }
  if (inv.companyPhone) { doc.text(inv.companyPhone, 14, y); y += 5; }
  if (inv.companyAddress) { doc.text(inv.companyAddress, 14, y); y += 5; }

  // Invoice title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 167, 148);
  doc.text("INVOICE", pageWidth - 14, 22, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.setFont("helvetica", "normal");
  doc.text(`#${inv.invoiceNumber}`, pageWidth - 14, 30, { align: "right" });
  doc.text(`Date: ${inv.createdAt}`, pageWidth - 14, 36, { align: "right" });
  if (inv.dueDate) doc.text(`Due: ${inv.dueDate}`, pageWidth - 14, 42, { align: "right" });
  if (inv.status) {
    doc.setFont("helvetica", "bold");
    doc.text(inv.status.toUpperCase(), pageWidth - 14, inv.dueDate ? 48 : 42, { align: "right" });
  }

  // Bill To
  let billY = Math.max(y + 8, 52);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("BILL TO", 14, billY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  billY += 6;
  doc.text(inv.customerName, 14, billY); billY += 5;
  if (inv.customerEmail) { doc.text(inv.customerEmail, 14, billY); billY += 5; }
  if (inv.customerPhone) { doc.text(inv.customerPhone, 14, billY); billY += 5; }
  if (inv.customerAddress) { doc.text(inv.customerAddress, 14, billY); billY += 5; }

  // Items table
  const tableStartY = billY + 8;
  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Description", "Qty", "Unit Price", "Total"]],
    body: inv.items.map((item, i) => [
      String(i + 1),
      item.description,
      String(item.quantity),
      `${cs}${item.unit_price.toFixed(2)}`,
      `${cs}${item.total.toFixed(2)}`,
    ]),
    headStyles: { fillColor: [40, 167, 148], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = pageWidth - 80;

  const drawRow = (label: string, value: string, yPos: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(bold ? 40 : 80);
    doc.text(label, summaryX, yPos);
    doc.text(value, pageWidth - 14, yPos, { align: "right" });
  };

  let sy = finalY;
  drawRow("Subtotal", `${cs}${inv.subtotal.toFixed(2)}`, sy);
  sy += 7;

  if (inv.discountAmount > 0) {
    const discLabel = inv.discountType === "percentage"
      ? `Discount (${inv.discountValue}%)`
      : "Discount";
    drawRow(discLabel, `-${cs}${inv.discountAmount.toFixed(2)}`, sy);
    sy += 7;
  }

  if (inv.taxAmount > 0) {
    const taxLabel = inv.taxName
      ? `${inv.taxName} (${inv.taxRate}%)`
      : `Tax (${inv.taxRate}%)`;
    drawRow(taxLabel, `${cs}${inv.taxAmount.toFixed(2)}`, sy);
    sy += 7;
  }

  doc.setDrawColor(200);
  doc.line(summaryX, sy - 2, pageWidth - 14, sy - 2);
  sy += 3;
  drawRow("Total", `${cs}${inv.total.toFixed(2)}`, sy, true);

  // Notes
  if (inv.notes) {
    sy += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text("Notes", 14, sy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(inv.notes, pageWidth - 28);
    doc.text(lines, 14, sy + 6);
    sy += 6 + lines.length * 5;
  }

  // Terms & Conditions
  if (inv.termsAndConditions) {
    sy += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text("Terms & Conditions", 14, sy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const lines = doc.splitTextToSize(inv.termsAndConditions, pageWidth - 28);
    doc.text(lines, 14, sy + 6);
  }

  doc.save(`${inv.invoiceNumber}.pdf`);
}
