
import { PDFDocument, rgb } from 'pdf-lib';
import fetch from 'node-fetch';

// Hardcoded values (not recommended for production)
const GRAPH_API_TOKEN = 'Wqnvu1IYl3EIUyw5ir6vN-TfsPo44tzEPSseH9Zv';
const WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAAAaWQHvIM/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=gmcYczs8GQns_HUKnOJIkld_fOlMDIjLLki3TXB6lMw';
const ZONE_ID = '174f936387e2cf4c433752dc46ba6bb1';


// Hardcoded values (not recommended for production)
const CLOUDFLARE_BEARER_TOKEN = 'your_cloudflare_bearer_token';
const CLOUDFLARE_ZONE_ID = 'your_cloudflare_zone_id';

async function fetchFirewallEvents() {
  const url = 'https://api.cloudflare.com/client/v4/graphql/';

  // Calculate datetime range for the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const query = `
    query ListFirewallEvents($zoneTag: String!, $filter: FirewallEventsAdaptiveFilter_InputObject) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          firewallEventsAdaptive(
            filter: $filter
            limit: 10
            orderBy: [datetime_DESC]
          ) {
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
    zoneTag: CLOUDFLARE_ZONE_ID,
    filter: {
      datetime_geq: sevenDaysAgo.toISOString(),
      datetime_leq: now.toISOString()
    }
  };

  const headers = {
    'Authorization': `Bearer ${CLOUDFLARE_BEARER_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  console.log(response)

  if (!response.ok) {
    throw new Error('Failed to fetch firewall events');
  }

  const data = await response.json();
  return data.data.viewer.zones[0].firewallEventsAdaptive;
}

async function generatePdf(events) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  // Set up fonts and dimensions
  const { width, height } = page.getSize();
  const fontSize = 12;
  const margin = 50;

  // Title
  page.drawText('Firewall Events Report', {
    x: width / 2 - 50,
    y: height - margin,
    size: 18,
    color: rgb(0, 0, 0),
  });

  // Content
  let y = height - margin - 30;
  events.forEach(event => {
    const { datetime, source, action, clientIP, clientRequestPath } = event;
    page.drawText(`Datetime: ${datetime}`, { x: margin, y, size: fontSize });
    y -= 20;
    page.drawText(`Source: ${source}`, { x: margin, y, size: fontSize });
    y -= 20;
    page.drawText(`Action: ${action}`, { x: margin, y, size: fontSize });
    y -= 20;
    page.drawText(`Client IP: ${clientIP}`, { x: margin, y, size: fontSize });
    y -= 20;
    page.drawText(`Client Request Path: ${clientRequestPath}`, { x: margin, y, size: fontSize });
    y -= 40; // space between events
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

async function main() {
  try {
    const events = await fetchFirewallEvents();
    const pdfBytes = await generatePdf(events);

    // You can send the pdfBytes to a webhook or save it locally, etc.
    // For sending to a webhook, use node-fetch or another HTTP client.

    console.log('PDF generated successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
