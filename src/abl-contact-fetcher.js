// abl-contact-fetcher.js
const axios = require('axios');

/**
 * Fetch contacts from ABL API
 * @param {Object} options - Configuration options
 * @param {string} options.apiKey - x-api-key header value
 * @param {string} options.campaignId - Campaign identifier
 * @param {number} options.noOfContactsToGet - Number of contacts to retrieve
 * @param {Object} options.queryObject - Query parameters for filtering contacts
 * @param {string} [options.baseUrl='http://localhost:8081'] - API base URL
 * @param {string} [options.endpointPath='/api/campaign-contacts'] - API endpoint path
 * @param {number} [options.timeoutMs=15000] - Request timeout in milliseconds
 * @returns {Promise<Object>} - API response data
 */
async function fetchABLContacts(options) {
  // Validate required parameters
  if (!options.apiKey) {
    throw new Error('Missing API key. Provide apiKey in options.');
  }
  /*
  if (!options.campaignId) {
    throw new Warning('Missing campaignId. You can provide campaignId in options to exclude contacts that have already been sent for other campaigns.');
  }
    */
  if (!Number.isInteger(options.noOfContactsToGet) || options.noOfContactsToGet <= 0) {
    throw new Error('noOfContactsToGet must be a positive integer.');
  }

  // Set defaults inline with the function parameters
  const config = {
    baseUrl: 'http://localhost:8081',
    endpointPath: '/api/campaign-contacts',
    timeoutMs: 15000,
    ...options
  };

  // Create axios instance
  const api = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeoutMs,
    headers: { 'x-api-key': config.apiKey },
  });

  try {
    const response = await api.get(config.endpointPath, {
      params: {
        query: JSON.stringify(config.queryObject),
        noOfContactsToGet: config.noOfContactsToGet,
        campaignId: config.campaignId,
      },
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`ABL API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Network error: ${error.message}`);
    }
  }
}

/**
 * Example usage function (for testing)
 */
async function exampleUsage() {
  const config = {
    apiKey: 'e0f43805fd56354bb66d323b61281903889a7b2d42f5603fafff45e4928dc45a',
    campaignId: 'abc123',
    noOfContactsToGet: 2,
    queryObject: {
      included: {
        industry: ['marketing and advertising'],
        job_company_size: ['1-10', '51-200', '11-50', '201-500'],
      },
      excluded: {},
    },
  };

  try {
    const data = await fetchABLContacts(config);
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Export the main function
module.exports = {
  fetchABLContacts,
  exampleUsage
};

// If run directly, execute example
if (require.main === module) {
  exampleUsage().catch(() => {
    process.exitCode = 1;
  });
}
