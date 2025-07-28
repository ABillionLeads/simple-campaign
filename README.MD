[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/ABillionLeads/simple-campaign&envs=DATABASE_URL)


One-stop-shop to setup the domains, the smtp servers and start sending in 7 lines of code.
Keep track of you've reached out to and cover all your target market.
Easily sanitize your CRM and take full control of your pipeline.
One click deploy.

# TLDR: Click here, then click here... sign up here. Click send. Watch it fall apart.

You signed up.  
You paid.  
You were promised unlimited leads and effortless outreach.

Then came reality:

- You needed SMTP servers… and a **warm‑up routine**  
- You needed **email verification**, **deduplication**, **sending schedules**  
- You were told it’s "all included" — then learned about *only sending during working hours*, *seating models*, and *usage caps* disguised as *fair use policies*  
- Sanitizing your CRM becomes an absolute nightmare
- The so called AI tools are very hard to use. What if you want to personalize the email taking into account the latest company tweets, blog articles or LinkedIn posts?

It should not be this hard.


## 🧠 What We Built Instead

**A Billion Leads** is the simple, honest foundation for cold email campaigns.

1. 🔍 **Search** for the people you actually want to reach (interface or API).
2. ✂️ **Copy** the raw query from the console.
3. 🧠 **Plug** it into your own personalization pipeline.
4. 📬 **Send** from your own SMTP with full transparency and no vendor lock‑in.

### 💰 Pricing

You pay **per profile**, *not* per email.

- **\$0.01 = one fresh, verified profile with an email address**
- No “seats”, no fake “unlimited” plans, no working‑hours‑only nonsense
- You own the stack from query → personalization → delivery

---

## ⚙️ One‑Click Infra (Optional)

Use our one‑click‑deployable sender on **Railway**:

- Runs every hour via cron
- Pulls from your Neon Postgres database
- Uses Nodemailer with your SMTP credentials
- Enforces per‑campaign hourly limits
- Tracks `sent_at` timestamps and retries failures
- Shuts down after each run → **no idle billing**

```bash
# .env
DATABASE_URL=your_neon_postgres_url
```

# 💥 Simple, hackable, Bulk Email That *Actually* Works

We use namecheap to register the domains and create the smtp servers automatically using resend.com.

Here's a minimal and fully working campaign setup.

const abl = configure({
  ablKey: process.env.ABL_API_KEY,
  ablSMTPService: process.env.ABL_SMTP_SERVICE_APY_KEY,
  domainProviderKey: process.env.NAMECHEAP_API_KEY,
  railwayKey: process.env.RAILWAY_API_KEY,
  neonDBKey: process.env.NEON_DB_KEY
}).DEBUG();  

// you get the query from abillionleads.com console
await abl.query({"included":{"location_country":["united states"],"industry":["computer software"]},"excluded":{}})
   .take(100_000) 
   .sendEmails(lead => ({
     to:      lead.email,
     subject: 'Quick intro (debug)',
     body:    'Hello! (debug)',
   }));       // Logged only: no SMTP traffic since DEBUG mode

Now you can pause the campaign, increase email sending rate and view the results of your campaign in the resend dashboard.

Roadmap

Contributions will be monetized proportional to usage of the feature using a novel remuneration mechanism we are piloting. Apply here.

1. Help users better find their target market. 

- You tried AI tools and typed: `find me developers in San Francisco` …and got garbage.

The truth?  
📌 *Finding the right people is still a hard, unsolved problem in information retrieval — and most tools pretend it’s not.*

2. Add listeners for new x(twitter) posts, blog articles and Linkedin posts that you react to for a collection of leads.

3. Unified inbox viewer.

4. Support other domain providers for the setup.

5. Support for Amazon SES, Postmark, Mailgun, etc.