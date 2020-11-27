const wdResponse  = require('../../../../../../../_lib/response');

module.exports = (req, res) => {
    const { sessionId } = req.params;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(200).send(wdResponse(sessionId));
}
