const { configure } = require('./src/abl');

const abl = configure({
  ablKey:           process.env.ABL_API_KEY,
  ablSMTPService:   process.env.ABL_SMTP_SERVICE_KEY, // unused in this snippet
  domainProviderKey:process.env.NAMECHEAP_API_KEY,    // unused here
  databaseUrl:      process.env.DATABASE_URL,
  esNode:           process.env.ES_NODE
}).DEBUG();   // remove DEBUG() to actually insert/schedule and send

await abl.query('software engineers')
         .take(100)
         .sendEmails(lead => ({
           campaignId: 'de305d54-75b4-431b-ad5b-d6e0e7f9b91d', // existing campaign id
           to:      lead.email,
           subject: 'Quick intro (debug)',
           body:    '<p>Hello! (debug)</p>'
         }));
