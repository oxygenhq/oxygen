twilio.init(process.env.accountSid, process.env.authToken);
twilio.sendSms(process.env.accountSid, process.env.authToken, 'Hello');
var msg = twilio.getLastSms(true, 8000, 400*60*1000);
console.log("msg: " + msg);