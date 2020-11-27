const wdResponse  = require('../../../_lib/response');

module.exports = (req, res) => {
    const sessionId = '2216712c9e9afef0e03301140ebbe806';
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(200).send(wdResponse(
        sessionId, 
        {
            "acceptSslCerts":false,
            "browserName":"firefox",
            "browserVersion":"51.0.1",
            "command_id":1,
            "processId":2228,
            "takesScreenshot":true,
            "version":"51.0.1"
        }
    ));
}
