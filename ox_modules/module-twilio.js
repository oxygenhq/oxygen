/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for working with Twilio service.
 */

const OxError = require('../errors/OxygenError');
var errHelper = require('../errors/helper');

module.exports = function() {
    var deasync = require('deasync');

    var _client;
    
    module._isInitialized = function() {
        return _client !== undefined;
    };

    module.init = function(accountSid, authToken) {
        _client = require('twilio')(accountSid, authToken);
    };

    /**
     * @summary Retrieves last SMS message.
     * @function getLastSms
     * @param {Boolean} removeOnRead - Specifies whether to delete the message after reading it.
     * @param {Integer} timeout - Timeout in milliseconds for waiting for the message to arrive.
     * @param {Integer=} notOlderThan - Retrieve message only if it arrived not before the given time (in ms).
     *                                  Default is 4 minutes.
     * @return {String} SMS text.
     */
    module.getLastSms = function(removeOnRead, timeout, notOlderThan) {
        if (!notOlderThan) {
            notOlderThan = 4*60*1000;
        }
        var msg;
        var now = Date.now();
        var earliestMessageDate = now - notOlderThan;
        
        while (!msg && (Date.now() - now) < timeout) {
            var msgsProcessed = false;
            _client.messages.list(function(err, messages) {
                var _msg;
                for (_msg of messages) {
                    if (_msg.direction == 'inbound') {
                        var _msgDate = Date.parse(_msg.dateCreated);

                        // skip if message is older than `notOlderThan`
                        if (_msgDate < earliestMessageDate) {
                            continue;
                        }

                        // if message is newer than the previous one - save it
                        if (msg && Date.parse(msg.dateCreated) < _msgDate) {
                            msg = _msg;
                        } else if (!msg) {
                            msg = _msg;
                        }
                    }
                }
                msgsProcessed = true;
            });
            deasync.loopWhile(() => !msgsProcessed);
            deasync.sleep(800);
        }

        if (!msg) {
            throw new OxError(errHelper.errorCode.TIMEOUT, "Couldn't get the SMS within " + timeout + 'ms.');
        }

        var removed;
        if (removeOnRead) {
            _client.messages(msg.sid).remove().then(() => { removed = true; });
            deasync.loopWhile(() => !removed);
        }

        return msg.body;
    };

    return module;
};
