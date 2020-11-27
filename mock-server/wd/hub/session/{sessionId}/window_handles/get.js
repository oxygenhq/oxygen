const wdResponse  = require('../../../../../_lib/response');

module.exports = (req, res) => {
    const { sessionId } = req.params;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.status(200).send(wdResponse(sessionId, ['CDwindow-6B65556F91AF3C5A892471CC4DD424EA']));
}
