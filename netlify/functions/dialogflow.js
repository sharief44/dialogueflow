const dialogflow=require('@google-cloud/dialogflow');
const uuid=require('uuid');

exports.handler=async(event)=>{
 try{
  const {text}=JSON.parse(event.body);
  const sessionClient=new dialogflow.SessionsClient({
    credentials:{
      private_key:process.env.DF_PRIVATE_KEY.replace(/\n/g,'\n'),
      client_email:process.env.DF_CLIENT_EMAIL
    }
  });
  const sessionPath=sessionClient.projectAgentSessionPath(process.env.REACT_APP_PROJECT_ID,uuid.v4());
  const req={session:sessionPath,queryInput:{text:{text,languageCode:'en'}}};
  const res=await sessionClient.detectIntent(req);
  return {statusCode:200,body:JSON.stringify({reply:res[0].queryResult.fulfillmentText})};
 }catch(e){
  return {statusCode:500,body:JSON.stringify({error:e.message})};
 }
};
//new function for logging delete this later
exports.handler = async (event, context) => {
  try {
    console.log("Function invoked!");

    // Debug: show if env vars exist
    console.log("DF_CLIENT_EMAIL exists:", !!process.env.DF_CLIENT_EMAIL);
    console.log("DF_PRIVATE_KEY exists:", !!process.env.DF_PRIVATE_KEY);

    // Debug: show key format type
    if (process.env.DF_PRIVATE_KEY) {
      console.log("DF_PRIVATE_KEY starts with BEGIN:", process.env.DF_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----"));
      console.log("DF_PRIVATE_KEY ends with END:", process.env.DF_PRIVATE_KEY.includes("-----END PRIVATE KEY-----"));
      console.log("DF_PRIVATE_KEY contains literal \\n:", process.env.DF_PRIVATE_KEY.includes("\\n"));
    }

    // 🔥 Your actual email + key usage here
    // ...

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error("🔥 SERVER CRASH:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
