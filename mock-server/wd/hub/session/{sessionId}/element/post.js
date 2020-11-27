const wdResponse  = require('../../../../../_lib/response');

module.exports = (req, res) => {
    const { sessionId } = req.params;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(200).send(wdResponse(
        sessionId, 
        {'element-6066-11e4-a52e-4f735466cecf': 'b5ae5c7d-ba43-4392-94c9-37ade36854ad'}
    ));
}
