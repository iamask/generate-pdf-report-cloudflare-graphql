import fetch from 'node-fetch';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const CLOUDFLARE_BEARER_TOKEN = 'Wqnvu1IYUyw5itzEPSseH9Zv';
const ZONE_TAG = 'b58cebb2daf9371b20b'; // Replace with your Cloudflare zone tag

const fontSize = 10;

async function generatePDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Add title
  const title = 'Top Visitors by Source';
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const titleSize = fontSize * 1.5;
  page.drawText(title, { x: 50, y: height - 40, size: titleSize, font: titleFont, color: rgb(0, 0, 0) });

  // Add "5 items" text (assuming you have 5 data entries)
  const itemsText = `${data.length} items`;
  const itemsFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(itemsText, { x: width - 50, y: height - 40, size: fontSize, font: itemsFont, color: rgb(0, 0, 0), alignment: 'right' });

  // Add headers
  const headers = [
    'Source IP Addresses',
    'User Agents',
    'Paths',
    'Countries',
    'Hosts',
    'Source ASNS',
    'Firewall rules',
    'Rate limiting rules',
  ];
  const xStart = 50;
  const yStart = height - 70;
  const columnWidth = (width - 100) / 4;

  for (let i = 0; i < headers.length; i++) {
    const text = headers[i];
    page.drawText(text, {
      x: xStart + (i % 4) * columnWidth,
      y: yStart - (Math.floor(i / 4) * fontSize * 1.5),
      size: fontSize,
      font: itemsFont,
      color: rgb(0, 0, 0),
    });
  }

  // Add data
  let y = yStart - 100;
  for (const row of data) {
    for (let i = 0; i < row.length; i++) {
      const text = row[i];
      page.drawText(text, {
        x: xStart + (i % 4) * columnWidth,
        y: y,
        size: fontSize,
        font: itemsFont,
        color: rgb(0, 0, 0),
      });
    }
    y -= fontSize * 1.2;
  }

  const pdfBuffer = await pdfDoc.save();
  fs.writeFileSync('top_visitors.pdf', pdfBuffer);
  console.log('PDF generated successfully: top_visitors.pdf');
}

async function fetchCloudflareData() {
  const endpoint = 'https://api.cloudflare.com/client/v4/graphql/';

  const query = `
    query ListFirewallEvents($zoneTag: String!, $filter: FirewallEventsAdaptiveFilter_InputObject!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          firewallEventsAdaptive(filter: $filter, limit: 5, orderBy: [datetime_DESC]) {
            action
            clientAsn
            clientCountryName
            clientIP
            clientRequestPath
            clientRequestQuery
            datetime
            source
            userAgent
          }
        }
      }
    }
  `;

  const filter = {
    datetime_geq: '2024-07-08T00:00:00Z', // Adjust time range as needed
    datetime_leq: '2024-07-09T00:00:00Z', // Adjust time range as needed
  };

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        zoneTag: ZONE_TAG,
        filter: filter,
      },
    }),
  };

  try {
    const response = await fetch(endpoint, options);
    const json = await response.json();

    if (!json.data) {
      throw new Error('Error fetching Cloudflare data: ' + JSON.stringify(json.errors));
    }

    const events = json.data.viewer.zones[0].firewallEventsAdaptive;
    const formattedData = events.map(event => [
      event.clientIP,
      event.userAgent,
      event.clientRequestPath,
      event.clientCountryName,
      event.source,
      event.clientAsn,
      event.action,
      event.clientRequestQuery,
    ]);

    return formattedData;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function main() {
  const data = await fetchCloudflareData();
  await generatePDF(data);
}

main();
