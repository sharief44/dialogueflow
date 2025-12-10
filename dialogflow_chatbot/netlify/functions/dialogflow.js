const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const message = body.text || "";

    const sessionId = uuid.v4();

    const config = {
      credentials: {
        private_key: process.env.DF_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.DF_CLIENT_EMAIL,
      }
    };

    const sessionClient = new dialogflow.SessionsClient(config);
    const sessionPath = sessionClient.projectAgentSessionPath(process.env.DF_PROJECT_ID, sessionId);

    const request = {
      session: sessionPath,
      queryInput: {
        text: { text: message, languageCode: 'en' }
      }
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    // Extract text
    const replyText = result.fulfillmentText || "";

    // Extract chips if present
    let chips = [];
    if (result.fulfillmentMessages) {
      result.fulfillmentMessages.forEach(msg => {
        if (msg.payload && msg.payload.fields && msg.payload.fields.richContent) {
          try {
            const rich = msg.payload.fields.richContent.listValue.values;
            const chipOptions = rich[0].listValue.values[0].structValue.fields.options.listValue.values;
            chips = chipOptions.map(c => c.structValue.fields.text.stringValue);
          } catch (err) {
            console.log("Chip parse error:", err);
          }
        }
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: replyText,
        chips: chips
      })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};