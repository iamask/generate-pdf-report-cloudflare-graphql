import fetch from 'node-fetch';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

const CLOUDFLARE_BEARER_TOKEN = 'Wqnvu1IYl3EIUyw5ir6vN-TfsPo44tzEPSseH9Zv';

async function fetchCloudflareData() {
  const endpoint = 'https://api.cloudflare.com/client/v4/graphql/';

  const query = `
    query ListFirewallEvents($zoneTag: String!, $filter: FirewallEventsAdaptiveFilter_InputObject!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          firewallEventsAdaptive(filter: $filter, limit: 10, orderBy: [datetime_DESC]) {
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

  const variables = {
    zoneTag: "b58cebb2d5fd636f67c10aaf9371b20b", // Replace with your Cloudflare Zone ID
    filter: {
      datetime_geq: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days from now
      datetime_leq: new Date().toISOString()
    }
  };

  const requestBody = {
    query,
    variables
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLOUDFLARE_BEARER_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();

    // Check for GraphQL errors
    if (responseData.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(responseData.errors)}`);
    }

    // Ensure data structure exists before accessing deeply nested properties
    if (!responseData.data || !responseData.data.viewer || !responseData.data.viewer.zones[0]) {
      throw new Error('Unexpected response structure from Cloudflare API');
    }

    return responseData.data.viewer.zones[0].firewallEventsAdaptive || [];
  } catch (error) {
    console.error('Error fetching data from Cloudflare:', error.message);
    return [];
  }
}

async function createPdf(events) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // Title
  page.drawText('Firewall Events Report', {
    x: margin,
    y,
    size: 24,
    font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    color: rgb(0, 0, 0),
  });
  y -= 30;

  // Draw each event
  events.forEach(async event => {
    y -= 20;

    // Action
    page.drawText(`Action: ${event.action}`, {
      x: margin,
      y,
      size: 14,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: rgb(0, 0, 0),
    });
    y -= 20;

    // Client IP
    page.drawText(`Client IP: ${event.clientIP}`, {
      x: margin,
      y,
      size: 12,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: rgb(0, 0, 0),
    });
    y -= 15;

    // Datetime
    page.drawText(`Datetime: ${event.datetime}`, {
      x: margin,
      y,
      size: 12,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: rgb(0, 0, 0),
    });
    y -= 15;

    // User Agent
    page.drawText(`User Agent: ${event.userAgent}`, {
      x: margin,
      y,
      size: 12,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: rgb(0, 0, 0),
    });
    y -= 20;

    // Separator line
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    y -= 10; // Space after separator
  });

  const pdfBytes = await pdfDoc.save();

  // Write the PDF to a file
  const pdfFileName = 'firewall_events_report.pdf';
  fs.writeFileSync(pdfFileName, pdfBytes);
  console.log(`PDF created successfully: ${pdfFileName}`);
}

// Main function to fetch data and create PDF
async function main() {
  try {
    const events = await fetchCloudflareData();
    await createPdf(events);
  } catch (error) {
    console.error('Error during execution:', error);
  }
}

// Execute main function
main();
