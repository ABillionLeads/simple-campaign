// sample.js — Example usage of campaign management functions
require('dotenv').config();

const { createCampaign, insertCampaignContacts } = require('./src/campaign-manager');

async function runSample() {
  try {
    console.log('🚀 Creating sample campaign...\n');

    // Create a sample campaign
    const campaign = await createCampaign({
      name: 'Product Launch Campaign',
      api_key: 'sample-product-api-key',
      es_query: {
        query: {
          bool: {
            must: [
              { match: { status: 'active' } },
              { match: { product_interest: 'new_features' } }
            ]
          }
        }
      },
      use_net_new: true,
      exclude_campaign_ids: [],
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-app-password'
        },
        from: 'noreply@yourcompany.com'
      },
      per_hour_limit: 50
    });

    console.log('\n📧 Adding campaign contacts...\n');

    // Create sample contacts with different email templates
    const sampleContacts = [
      {
        email: 'alice@example.com',
        subject: '🎉 Exciting New Features Just Launched!',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2c3e50;">🎉 Exciting New Features Just Launched!</h1>
              <p>Hi Alice,</p>
              <p>We're thrilled to announce that our latest product update is now live! Here's what's new:</p>
              <ul>
                <li>🚀 Enhanced performance</li>
                <li>🎨 Beautiful new interface</li>
                <li>🔒 Improved security features</li>
              </ul>
              <p>Ready to explore? <a href="https://yourcompany.com/features" style="color: #3498db;">Check it out now</a></p>
              <p>Best regards,<br>The Team</p>
            </body>
          </html>
        `,
        text: `🎉 Exciting New Features Just Launched!\n\nHi Alice,\n\nWe're thrilled to announce that our latest product update is now live! Check it out at https://yourcompany.com/features\n\nBest regards,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'alice-123'
      },
      {
        email: 'bob@example.com',
        subject: '🔥 Hot New Features - Don\'t Miss Out!',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #e74c3c;">🔥 Hot New Features - Don't Miss Out!</h1>
              <p>Hey Bob,</p>
              <p>Big news! We've just rolled out some amazing new features that we think you'll love:</p>
              <ul>
                <li>⚡ Lightning-fast loading</li>
                <li>📱 Mobile-optimized experience</li>
                <li>🛡️ Advanced security</li>
              </ul>
              <p><a href="https://yourcompany.com/features" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore Now</a></p>
              <p>Cheers,<br>The Team</p>
            </body>
          </html>
        `,
        text: `🔥 Hot New Features - Don't Miss Out!\n\nHey Bob,\n\nBig news! We've just rolled out some amazing new features. Explore them at https://yourcompany.com/features\n\nCheers,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'bob-456'
      },
      {
        email: 'carol@example.com',
        subject: '✨ Your Exclusive Access to New Features',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #9b59b6;">✨ Your Exclusive Access to New Features</h1>
              <p>Dear Carol,</p>
              <p>As a valued customer, you get early access to our latest features:</p>
              <ul>
                <li>🎯 Personalized recommendations</li>
                <li>📊 Advanced analytics</li>
                <li>🔔 Smart notifications</li>
              </ul>
              <p>Your exclusive access is ready: <a href="https://yourcompany.com/early-access" style="color: #9b59b6;">Get Started</a></p>
              <p>Warm regards,<br>The Team</p>
            </body>
          </html>
        `,
        text: `✨ Your Exclusive Access to New Features\n\nDear Carol,\n\nAs a valued customer, you get early access to our latest features. Get started at https://yourcompany.com/early-access\n\nWarm regards,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'carol-789'
      },
      {
        email: 'david@example.com',
        subject: '🚀 Major Update: What\'s New for You',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #f39c12;">🚀 Major Update: What's New for You</h1>
              <p>Hi David,</p>
              <p>We've been working hard to bring you the best experience possible. Here's what's new:</p>
              <ul>
                <li>🎨 Redesigned dashboard</li>
                <li>📈 Better reporting tools</li>
                <li>🔧 Simplified settings</li>
              </ul>
              <p>Ready to see the improvements? <a href="https://yourcompany.com/update" style="color: #f39c12;">Take a look</a></p>
              <p>Thanks,<br>The Team</p>
            </body>
          </html>
        `,
        text: `🚀 Major Update: What's New for You\n\nHi David,\n\nWe've been working hard to bring you the best experience possible. Take a look at https://yourcompany.com/update\n\nThanks,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'david-101'
      },
      {
        email: 'emma@example.com',
        subject: '🎊 Special Announcement: New Features Live!',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1abc9c;">🎊 Special Announcement: New Features Live!</h1>
              <p>Hello Emma,</p>
              <p>We're excited to share that our latest features are now available:</p>
              <ul>
                <li>🌐 Global connectivity</li>
                <li>📱 Cross-platform sync</li>
                <li>🔐 Enterprise security</li>
              </ul>
              <p>Discover what's new: <a href="https://yourcompany.com/announcement" style="color: #1abc9c;">Learn More</a></p>
              <p>Best wishes,<br>The Team</p>
            </body>
          </html>
        `,
        text: `🎊 Special Announcement: New Features Live!\n\nHello Emma,\n\nWe're excited to share that our latest features are now available. Learn more at https://yourcompany.com/announcement\n\nBest wishes,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'emma-202'
      },
      {
        email: 'frank@example.com',
        subject: '⚡ Performance Boost: Experience the Difference',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #e67e22;">⚡ Performance Boost: Experience the Difference</h1>
              <p>Hi Frank,</p>
              <p>We've made some incredible performance improvements:</p>
              <ul>
                <li>⚡ 3x faster loading</li>
                <li>🔄 Real-time updates</li>
                <li>💾 Optimized storage</li>
              </ul>
              <p>Experience the difference: <a href="https://yourcompany.com/performance" style="color: #e67e22;">Try Now</a></p>
              <p>Regards,<br>The Team</p>
            </body>
          </html>
        `,
        text: `⚡ Performance Boost: Experience the Difference\n\nHi Frank,\n\nWe've made some incredible performance improvements. Try it now at https://yourcompany.com/performance\n\nRegards,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'frank-303'
      },
      {
        email: 'grace@example.com',
        subject: '🎯 Personalized Features Just for You',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8e44ad;">🎯 Personalized Features Just for You</h1>
              <p>Dear Grace,</p>
              <p>We've created some amazing personalized features based on your usage:</p>
              <ul>
                <li>🎯 Smart recommendations</li>
                <li>📊 Custom dashboards</li>
                <li>🔔 Personalized alerts</li>
              </ul>
              <p>Your personalized experience awaits: <a href="https://yourcompany.com/personalized" style="color: #8e44ad;">Explore</a></p>
              <p>Warmly,<br>The Team</p>
            </body>
          </html>
        `,
        text: `🎯 Personalized Features Just for You\n\nDear Grace,\n\nWe've created some amazing personalized features based on your usage. Explore them at https://yourcompany.com/personalized\n\nWarmly,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'grace-404'
      },
      {
        email: 'henry@example.com',
        subject: '🔒 Enhanced Security: Your Data, Protected',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #27ae60;">🔒 Enhanced Security: Your Data, Protected</h1>
              <p>Hello Henry,</p>
              <p>We've upgraded our security to keep your data even safer:</p>
              <ul>
                <li>🔐 Two-factor authentication</li>
                <li>🛡️ Advanced encryption</li>
                <li>👁️ Privacy controls</li>
              </ul>
              <p>Learn about our security: <a href="https://yourcompany.com/security" style="color: #27ae60;">Read More</a></p>
              <p>Stay safe,<br>The Team</p>
            </body>
          </html>
        `,
        text: `🔒 Enhanced Security: Your Data, Protected\n\nHello Henry,\n\nWe've upgraded our security to keep your data even safer. Read more at https://yourcompany.com/security\n\nStay safe,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'henry-505'
      },
      {
        email: 'iris@example.com',
        subject: '📱 Mobile-First: Your Experience, Everywhere',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3498db;">📱 Mobile-First: Your Experience, Everywhere</h1>
              <p>Hi Iris,</p>
              <p>We've completely redesigned for mobile users:</p>
              <ul>
                <li>📱 Touch-optimized interface</li>
                <li>🔄 Seamless sync</li>
                <li>⚡ Offline capabilities</li>
              </ul>
              <p>Try our mobile experience: <a href="https://yourcompany.com/mobile" style="color: #3498db;">Download App</a></p>
              <p>Cheers,<br>The Team</p>
            </body>
          </html>
        `,
        text: `📱 Mobile-First: Your Experience, Everywhere\n\nHi Iris,\n\nWe've completely redesigned for mobile users. Download our app at https://yourcompany.com/mobile\n\nCheers,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'iris-606'
      },
      {
        email: 'jack@example.com',
        subject: '🎨 Beautiful Design: See the New Look',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #e91e63;">🎨 Beautiful Design: See the New Look</h1>
              <p>Hey Jack,</p>
              <p>We've given our platform a beautiful new design:</p>
              <ul>
                <li>🎨 Modern interface</li>
                <li>🌈 Custom themes</li>
                <li>📐 Better layouts</li>
              </ul>
              <p>See the new look: <a href="https://yourcompany.com/design" style="color: #e91e63;">View Design</a></p>
              <p>Enjoy,<br>The Team</p>
            </body>
          </html>
        `,
        text: `🎨 Beautiful Design: See the New Look\n\nHey Jack,\n\nWe've given our platform a beautiful new design. View it at https://yourcompany.com/design\n\nEnjoy,\nThe Team`,
        es_index: 'users',
        es_doc_id: 'jack-707'
      }
    ];

    // Insert all contacts
    const contacts = await insertCampaignContacts(campaign.id, sampleContacts);

    console.log('\n✅ Sample campaign created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Campaign: ${campaign.name}`);
    console.log(`   Campaign ID: ${campaign.id}`);
    console.log(`   Contacts added: ${contacts.length}`);
    console.log(`   Hourly limit: 50 emails`);
    console.log('\n📧 Sample emails:');
    contacts.forEach((contact, index) => {
      console.log(`   ${index + 1}. ${contact.email} - "${contact.subject}"`);
    });

  } catch (error) {
    console.error('❌ Error creating sample campaign:', error);
    process.exit(1);
  }
}

// Run the sample
runSample().then(() => {
  console.log('\n🎉 Sample campaign creation completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Sample campaign creation failed:', error);
  process.exit(1);
});
