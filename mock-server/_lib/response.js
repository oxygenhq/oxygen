module.exports = function(sessionId, value = {}) {
    return {
        "sessionId": `${sessionId}`,
        "value": value
    };
};