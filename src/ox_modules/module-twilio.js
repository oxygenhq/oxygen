/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name twilio
 * @description Provides methods for working with Twilio service.
 */
import OxErrorContsructor from '../errors/OxygenError';

module.exports = function() {
    const deasync = require('deasync');
    const utils = require('./utils');
    const OxError = this.OxError = OxErrorContsructor;
    const errHelper = this.errHelper = require('../errors/helper');
    const helpers = this.helpers = {};

    var _client;

    module.isInitialized = function() {
        return _client !== undefined;
    };

    /**
     * @summary Set Twilio authentication details.
     * @function init
     * @param {String} accountSid - Account SID.
     * @param {String} authToken - Authentication token.
     */
    module.init = function(accountSid, authToken) {
        _client = require('twilio')(accountSid, authToken);
    };

    /**
     * @summary Retrieves last SMS message.
     * @function getLastSms
     * @param {Boolean} removeOnRead - Specifies whether to delete the message after reading it.
     * @param {Number} timeout - Timeout in milliseconds for waiting for the message to arrive.
     * @param {Number=} notOlderThan - Retrieve message only if it arrived not before the given time (in ms).
     *                                 Default is 4 minutes.
     * @return {String} SMS text.
     */
    module.getLastSms = function(removeOnRead, timeout, notOlderThan) {
        helpers.assertArgumentBool(removeOnRead, 'removeOnRead');
        helpers.assertArgumentNumberNonNegative(timeout, 'timeout');

        if (!notOlderThan) {
            notOlderThan = 4*60*1000;
        }
        var msg;
        var now = Date.now();
        var earliestMessageDate = new Date(now - notOlderThan);

        while (!msg && (Date.now() - now) < timeout) {
            var msgsProcessed = false;
            _client.messages.list({ dateSentAfter: earliestMessageDate }, function(err, messages) {
                var _msg;
                if (messages && typeof messages[Symbol.iterator] === 'function') {
                    for (_msg of messages) {
                        if (_msg.direction == 'inbound') {
                            var _msgDate = Date.parse(_msg.dateCreated);
                            // if message is newer than the previous one - save it
                            if (msg && Date.parse(msg.dateCreated) < _msgDate) {
                                msg = _msg;
                            } else if (!msg) {
                                msg = _msg;
                            }
                        }
                    }
                }
                msgsProcessed = true;
            });
            deasync.loopWhile(() => !msgsProcessed);
            deasync.sleep(800);
        }

        if (!msg) {
            throw new OxError(errHelper.errorCode.TWILIO_ERROR, "Couldn't get the SMS within " + timeout + 'ms.');
        }

        var removed;
        if (removeOnRead) {
            _client.messages(msg.sid).remove().then(() => { removed = true; });
            deasync.loopWhile(() => !removed);
        }

        return msg.body;
    };

    /**
     * @summary Send an SMS.
     * @function sendSms
     * @param {String} from - Phone number to send from.
     * @param {String} to - Phone number to send to.
     * @param {String} message - Message to send.
     * @return {String} Message SID.
     * @example <caption>[javascript] Usage example</caption>
     * twilio.init('Account Sid', 'Account Token');
     * twilio.sendSms('+1xxxxxxxxxx', '+972xxxxxxxxx', 'Hello World!');
     */
    module.sendSms = function(from, to, message) {
        helpers.assertArgumentNonEmptyString(from, 'from');
        helpers.assertArgumentNonEmptyString(to, 'to');
        helpers.assertArgumentNonEmptyString(message, 'message');

        var response = null;

        _client.messages.create({
            body: message,
            from: from,
            to: to
        }).then(message => {
            response = message.sid;
        }).catch(err => {
            response = err;
        });

        deasync.loopWhile(() => !response);

        if (response.message) {
            var msg = response.message;
            if (response.moreInfo) {
                msg += ' For more info: ' + response.moreInfo;
            } else if (response.code) {
                msg = 'Unable to connect to Twilio: ' + msg;
            }
            throw new OxError(errHelper.errorCode.TWILIO_ERROR, msg);
        }

        return response;
    };

    helpers.assertArgument = (val, name) => utils.assertArgument.call(this, val, name);
    helpers.assertArgumentNonEmptyString = (val, name) => utils.assertArgumentNonEmptyString.call(this, val, name);
    helpers.assertArgumentNumber = (val, name) => utils.assertArgumentNumber.call(this, val, name);
    helpers.assertArgumentNumberNonNegative = (val, name) => utils.assertArgumentNumberNonNegative.call(this, val, name);
    helpers.assertArgumentBool = (val, name) => utils.assertArgumentBool.call(this, val, name);
    helpers.assertArgumentBoolOptional = (val, name) => utils.assertArgumentBoolOptional.call(this, val, name);
    helpers.assertArgumentTimeout = (val, name) => utils.assertArgumentTimeout.call(this, val, name);

    return module;
};
