const query = {"included":{"industry":["marketing and advertising"],"job_company_size":["1-10","51-200","11-50","201-500"]},"excluded":{}};

async function createCampaign(ablApiKey, query, numberOfContacts) {
  
}

// we need to notify the server we're going to contact these ids
// never pull more contacts than we need to in the following hour
// we will mark them as contacted optimistically 
async function insertCampaignContacts(ablApiKey, campaignId) {
  
}