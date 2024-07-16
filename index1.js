import fetch from 'node-fetch';

const CLOUDFLARE_BEARER_TOKEN = 'Wqnvu1IYltzEPSseH9Zv';

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
    return null;
  }
}

// Example usage
fetchCloudflareData()
  .then(events => {
    if (events && events.length > 0) {
      console.log('Fetched firewall events:');
      console.log(events);
    } else {
      console.log('No events fetched or empty response.');
    }
  })
  .catch(error => {
    console.error('Error during fetch:', error);
  });
