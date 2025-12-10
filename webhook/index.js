// webhook/index.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

// Optional secret check
function checkSecret(req) {
  const secretEnv = process.env.WEBHOOK_SECRET;
  if (!secretEnv) return true;
  const sent = req.get('x-webhook-secret') || '';
  return sent === secretEnv;
}

// Utility to build button payload responses
function buildButtonFulfillment(text, buttons = []) {
  return {
    fulfillmentMessages: [
      { text: { text: [text] } },
      { payload: { buttons } }
    ],
    fulfillmentText: text
  };
}

/* ---------------------------------------------
   MAIN WEBHOOK HANDLER
--------------------------------------------- */
app.post('/', async (req, res) => {
  try {
    if (!checkSecret(req)) {
      return res.status(403).json({ fulfillmentText: 'Forbidden' });
    }

    const body = req.body || {};
    const intent = body.queryResult?.intent?.displayName || '';
    const session = body.session || '';

    console.log("🔥 Webhook intent:", intent);

    /* -------------------------------------------------
       DEFAULT WELCOME + SHOW OPTIONS (your earlier logic)
    --------------------------------------------------- */
    if (intent === 'Show_Options' || intent === 'Default Welcome Intent') {
      const buttons = [
        { title: 'AboutUs', payload: 'AboutUs' },
        { title: 'What is Scriptbees?', payload: 'what is Scriptbees' },
        { title: 'Documentation', payload: 'Documentation' },
        { title: 'Contact support', payload: 'Contact support' }
      ];
      return res.json(buildButtonFulfillment('Hi! Choose an option below:', buttons));
    }

    /* -------------------------------------------------
       🍀 YOUR CUSTOM 4 INTENTS
    --------------------------------------------------- */

    // 1️⃣ What services do you offer? — intent: company_services
    if (intent === 'company_services') {
      return res.json(
        buildButtonFulfillment(
          'We offer full-stack development, cloud solutions, AI/ML, modernization, and more. Want to explore next?',
          [
            { title: 'AI / ML Solutions', payload: 'AI ML services' },
            { title: 'Modernization', payload: 'application modernization' },
            { title: 'Development Process', payload: 'development process' }
          ]
        )
      );
    }

    // 2️⃣ Can you help modernize my application? — intent: company_modernization
    if (intent === 'company_modernization') {
      return res.json(
        buildButtonFulfillment(
          'Absolutely! We modernize legacy systems, rebuild outdated apps, and improve performance.',
          [
            { title: 'Our Services', payload: 'What services do you offer' },
            { title: 'AI / ML Solutions', payload: 'AI ML services' },
            { title: 'Development Process', payload: 'development process' }
          ]
        )
      );
    }

    // 3️⃣ Do you provide AI/ML solutions? — intent: company_AI&ML
    if (intent === 'company_AI&ML') {
      return res.json(
        buildButtonFulfillment(
          'Yes! We build AI models, ML pipelines, automation, predictive analytics, and chatbot systems.',
          [
            { title: 'Modernize My App', payload: 'application modernization' },
            { title: 'Our Services', payload: 'What services do you offer' },
            { title: 'Development Process', payload: 'development process' }
          ]
        )
      );
    }

    // 4️⃣ What is your development process? — intent: sd_process
    if (intent === 'sd_process') {
      return res.json(
        buildButtonFulfillment(
          'Our process includes requirement analysis, design, development, testing, deployment, and ongoing support.',
          [
            { title: 'Services', payload: 'What services do you offer' },
            { title: 'AI / ML', payload: 'AI ML services' },
            { title: 'Contact Support', payload: 'Contact support' }
          ]
        )
      );
    }

    /* -------------------------------------------------
       PRICING EXAMPLE (OPTIONAL)
    --------------------------------------------------- */
    if (intent === 'Get_Pricing') {
      return res.json(
        buildButtonFulfillment(
          'Here are our pricing tiers:',
          [
            { title: 'Starter — $9/mo', payload: 'Pricing Starter' },
            { title: 'Pro — $29/mo', payload: 'Pricing Pro' },
            { title: 'Enterprise — Contact Sales', payload: 'Contact support' }
          ]
        )
      );
    }

    if (intent === 'Pricing') {
      return res.json({
        fulfillmentText: 'Our pricing: Starter $9, Pro $29, Enterprise — contact sales.'
      });
    }

    /* -------------------------------------------------
       FALLBACK
    --------------------------------------------------- */
    return res.json({
      fulfillmentText: "Sorry — I didn't understand that. Try asking about services or pricing."
    });

  } catch (err) {
    console.error('Webhook Error:', err);
    return res.json({ fulfillmentText: 'Internal webhook error.' });
  }
});

/* ---------------------------------------------
   START SERVER
--------------------------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🌐 Webhook listening on port ${PORT}`);
});
