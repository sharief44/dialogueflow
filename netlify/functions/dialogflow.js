// netlify/functions/dialogflow.js
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

exports.handler = async (event, context) => {
  try {
    const body = event.body && typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const text = (body.text || '').toString().trim();
    const incomingSessionId = body.sessionId || null;

    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing "text" in request body' }) };
    }

    const clientEmail = process.env.DF_CLIENT_EMAIL;
    const rawKey = process.env.DF_PRIVATE_KEY || '';
    const projectId = process.env.DF_PROJECT_ID || process.env.REACT_APP_PROJECT_ID || '';

    if (!clientEmail || !rawKey || !projectId) {
      console.error('Missing required DF env vars');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing Dialogflow credentials' }) };
    }

    const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
    const privateKeyClean = privateKey.trim();
    if (!privateKeyClean.includes('BEGIN PRIVATE KEY')) {
      console.error('Invalid DF_PRIVATE_KEY');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: invalid private key' }) };
    }

    const sessionClient = new dialogflow.SessionsClient({
      credentials: { private_key: privateKeyClean, client_email: clientEmail },
      projectId,
    });

    const sessionId = incomingSessionId || uuid.v4();
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const req = {
      session: sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: 'en-US',
        },
      },
    };

    const responses = await sessionClient.detectIntent(req);
    const queryResult = responses && responses[0] && responses[0].queryResult ? responses[0].queryResult : null;

    // primary textual reply
    let reply = '';
    if (queryResult) {
      if (Array.isArray(queryResult.fulfillmentMessages)) {
        for (const m of queryResult.fulfillmentMessages) {
          if (m.text && Array.isArray(m.text.text) && m.text.text[0]) {
            reply = m.text.text[0];
            break;
          }
        }
      }
      if (!reply && queryResult.fulfillmentText) reply = queryResult.fulfillmentText;
    }

    // extract first payload (if any)
    let payload = null;
    if (queryResult && Array.isArray(queryResult.fulfillmentMessages)) {
      for (const m of queryResult.fulfillmentMessages) {
        if (m.payload && typeof m.payload === 'object' && Object.keys(m.payload).length) {
          payload = m.payload;
          break;
        }
        if (m.message && m.message.payload && Object.keys(m.message.payload).length) {
          payload = m.message.payload;
          break;
        }
        if (m.payload && m.payload.fields) {
          const fields = m.payload.fields;
          const plain = {};
          for (const k of Object.keys(fields)) {
            const v = fields[k];
            if (v.stringValue !== undefined) plain[k] = v.stringValue;
            else if (v.numberValue !== undefined) plain[k] = v.numberValue;
            else if (v.boolValue !== undefined) plain[k] = v.boolValue;
            else if (v.structValue !== undefined) plain[k] = v.structValue;
            else if (v.listValue !== undefined) plain[k] = v.listValue;
            else plain[k] = v;
          }
          payload = plain;
          break;
        }
      }
    }

    const intentName = queryResult && queryResult.intent ? (queryResult.intent.displayName || '') : '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reply,
        intent: intentName,
        payload,
        sessionId,
      }),
    };
  } catch (err) {
    console.error('Dialogflow function error:', err && err.stack ? err.stack : err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err && err.message ? err.message : 'Internal server error' }),
    };
  }
};
