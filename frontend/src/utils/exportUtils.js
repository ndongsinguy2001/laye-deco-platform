import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Exporter en PDF
export const exportToPDF = (data, title, columns, filename) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Titre
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

  // Tableau
  const tableData = data.map(row => columns.map(col => {
    let value = row[col.key];
    if (col.format) {
      value = col.format(value);
    }
    return value || '-';
  }));

  const headers = columns.map(col => col.label);

  doc.autoTable({
    startY: 35,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save(`${filename}.pdf`);
};

// Exporter en Excel
export const exportToExcel = (data, title, columns, filename) => {
  // Préparer les données pour Excel
  const excelData = data.map(row => {
    const obj = {};
    columns.forEach(col => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value);
      }
      obj[col.label] = value || '-';
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `${filename}.xlsx`);
};

// Exporter en CSV
export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value);
      }
      const stringValue = String(value || '-');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(',');
  });

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};