const wdResponse  = require('../../../../_lib/response');

module.exports = (req, res) => {
    const { sessionId } = req.params;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(200).send(wdResponse(
        sessionId, 
        {
            sessionId,
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
