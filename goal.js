const { configure } = require('./src/abl');

// I JUST INSERT INTO THE CAMPAIGNS DATABASE
const abl = configure({
  DATABASE_URL:     process.env.DATABASE_URL,
  ABL_API_KEY:      process.env.ABL_API_KEY,
  RESEND_API_KEY:   process.env.RESEND_API_KEY,
  
}).DEBUG();   // remove DEBUG() to actually insert/schedule and send

await abl.query('software engineers')
         .take(100)
         .sendEmails(lead => ({
           campaignId: 'de305d54-75b4-431b-ad5b-d6e0e7f9b91d', // existing campaign id
           to:      lead.email,
           subject: 'Quick intro (debug)',
           body:    '<p>Hello! (debug)</p>'
         }));
