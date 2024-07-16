import fs from 'fs';
import  PDFDocument from 'pdfkit';


const data = [
  {
    action: 'log',
    clientAsn: '13335',
    clientCountryName: 'TH',
    clientIP: '172.68.240.132',
    clientRequestPath: '/api/v3/user/Dj',
    clientRequestQuery: '',
    datetime: '2024-06-14T10:01:12Z',
    source: 'apiShieldTokenValidation',
    userAgent: 'Mozilla/5.0 (compatible;Cloudflare-Healthchecks/1.0;+https://www.cloudflare.com/; healthcheck-id: 583310e54008ffe3)'
  },
  {
    action: 'log',
    clientAsn: '13335',
    clientCountryName: 'US',
    clientIP: '108.162.236.48',
    clientRequestPath: '/api/v3/user/Dj',
    clientRequestQuery: '',
    datetime: '2024-06-14T10:01:11Z',
    source: 'apiShieldTokenValidation',
    userAgent: 'Mozilla/5.0 (compatible;Cloudflare-Healthchecks/1.0;+https://www.cloudflare.com/; healthcheck-id: 583310e54008ffe3)'
  },
  {
    action: 'log',
    clientAsn: '13335',
    clientCountryName: 'AO',
    clientIP: '162.158.252.68',
    clientRequestPath: '/api/v3/user/Dj',
    clientRequestQuery: '',
    datetime: '2024-06-14T10:01:04Z',
    source: 'apiShieldTokenValidation',
    userAgent: 'Mozilla/5.0 (compatible;Cloudflare-Healthchecks/1.0;+https://www.cloudflare.com/; healthcheck-id: 583310e54008ffe3)'
  }
];

function createPDF(data) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('output.pdf'));

  // Add a title
  doc.fontSize(16).text('Log Data', { align: 'center' });
  doc.moveDown();

  // Add table header
  const headers = ['DateTime', 'Client IP', 'Client ASN'];
  const columnWidths = [200, 150, 100];
  
  headers.forEach((header, i) => {
    doc.fontSize(12).text(header, doc.x, doc.y, { width: columnWidths[i], align: 'left' });
  });
  doc.moveDown();

  // Add table rows
  data.forEach(item => {
    doc.fontSize(10).text(item.datetime, doc.x, doc.y, { width: columnWidths[0], align: 'left' });
    doc.text(item.clientIP, doc.x + columnWidths[0], doc.y, { width: columnWidths[1], align: 'left' });
    doc.text(item.clientAsn, doc.x + columnWidths[0] + columnWidths[1], doc.y, { width: columnWidths[2], align: 'left' });
    doc.moveDown();
  });

  // Finalize PDF file
  doc.end();
}

createPDF(data);
