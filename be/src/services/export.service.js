const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const { extractOrderField } = require('../utils/helpers');

const EXPORTS_DIR = path.join(__dirname, '../../public/exports');

const ensureExportsDir = () => {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
};

const generateExcelFile = async (orders, columns, batchId) => {
  ensureExportsDir();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Production Orders');

  const visibleColumns = columns.filter((c) => c.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  sheet.columns = visibleColumns.map((col) => ({
    header: col.headerLabel,
    key: col.fieldKey,
    width: 22,
  }));

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const order of orders) {
    const row = {};
    for (const col of visibleColumns) {
      row[col.fieldKey] = extractOrderField(order, col.fieldKey);
    }
    sheet.addRow(row);
  }

  const fileName = `production-batch-${batchId}-${Date.now()}.xlsx`;
  const filePath = path.join(EXPORTS_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath: `/exports/${fileName}` };
};

const generateOrderPdf = async (order) => {
  ensureExportsDir();
  const capImages =
    typeof order.capImages === 'string' ? JSON.parse(order.capImages) : order.capImages || {};
  const views = [
    { key: 'front', label: 'Front View' },
    { key: 'back', label: 'Back View' },
    { key: 'top', label: 'Top View' },
    { key: 'bottom', label: 'Bottom View' },
  ];

  const fileName = `order-${order.orderNumber.replace(/[^a-zA-Z0-9-]/g, '')}-${order.id}.pdf`;
  const filePath = path.join(EXPORTS_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).fillColor('#0f172a').text(`Order ${order.orderNumber}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#64748b').text(`Customer: ${order.customerEmail}`, { align: 'center' });
    doc.moveDown(1.5);

    views.forEach((view, index) => {
      if (index > 0 && index % 2 === 0) doc.addPage();
      const x = index % 2 === 0 ? 40 : 310;
      const y = index % 2 === 0 ? doc.y : doc.y - 200;

      doc.fontSize(13).fillColor('#1e293b').text(view.label, x, y);
      const imageData = capImages[view.key];

      if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image')) {
        try {
          const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64, 'base64');
          doc.image(buffer, x, y + 20, { width: 220, height: 180, fit: [220, 180] });
        } catch {
          doc.rect(x, y + 20, 220, 180).stroke('#e2e8f0');
          doc.fontSize(10).fillColor('#94a3b8').text('Image pending', x + 70, y + 100);
        }
      } else {
        doc.rect(x, y + 20, 220, 180).stroke('#e2e8f0');
        doc.fontSize(10).fillColor('#94a3b8').text('No image available', x + 55, y + 100);
      }

      if (index % 2 === 0) doc.moveDown(12);
    });

    doc.end();
    stream.on('finish', () => resolve({ fileName, filePath: `/exports/${fileName}` }));
    stream.on('error', reject);
  });
};

const generateZipArchive = async (pdfFiles, batchId) => {
  ensureExportsDir();
  const zipName = `production-pdfs-${batchId}-${Date.now()}.zip`;
  const zipPath = path.join(EXPORTS_DIR, zipName);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve({ fileName: zipName, filePath: `/exports/${zipName}` }));
    archive.on('error', reject);

    archive.pipe(output);
    for (const pdf of pdfFiles) {
      const fullPath = path.join(__dirname, '../../public', pdf.filePath.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) {
        archive.file(fullPath, { name: pdf.fileName });
      }
    }
    archive.finalize();
  });
};

module.exports = {
  EXPORTS_DIR,
  generateExcelFile,
  generateOrderPdf,
  generateZipArchive,
};
