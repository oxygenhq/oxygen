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
const util = require('util');
const deasync = require('deasync');
const utils = require('./utils');
import request from 'request';
import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errHelper from '../errors/helper';

const MODULE_NAME = 'twilio';

const BRIDGE_RESPONSE_TIMEOUT = 30 * 1000;

const BRIDGE_CALL_NEW = '/calls/new';

export default class TwilioModule extends OxygenModule {

    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);

        this._client = null;
    }

    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "http".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Set Twilio authentication details.
     * @function init
     * @param {String} accountSid - Account SID.
     * @param {String} authToken - Authentication token.
     * @param {String=} bridgeUrl - URL of the Twilio bridge service. This argument is required only for methods which deal with voice calls.
     */
    init(accountSid, authToken, bridgeUrl) {
        this._client = require('twilio')(accountSid, authToken);
        this._accountSid = accountSid;
        this._authToken = authToken;
        this._bridgeUrl = bridgeUrl;
        this._isInitialized = true;
    }

    /**
     * @summary Retrieves last SMS message.
     * @function getLastSms
     * @param {Boolean} removeOnRead - Specifies whether to delete the message after reading it.
     * @param {Number} timeout - Timeout in milliseconds for waiting for the message to arrive.
     * @param {Number=} notOlderThan - Retrieve message only if it arrived not before the given time (in ms).
     *                                 Default is 4 minutes.
     * @return {String} SMS text.
     */
    async getLastSms(removeOnRead, timeout, notOlderThan) {
        utils.assertArgumentBool(removeOnRead, 'removeOnRead');
        utils.assertArgumentNumberNonNegative(timeout, 'timeout');

        if (!notOlderThan) {
            notOlderThan = 4*60*1000;
        }
        var msg;
        var now = Date.now();
        var earliestMessageDate = new Date(now - notOlderThan);

        while (!msg && (Date.now() - now) < timeout) {
            var messages;
            try {
                messages = await this._client.messages.list({ dateSentAfter: earliestMessageDate });
            } catch (e) {
                 // ignored
            }

            if (messages && typeof messages[Symbol.iterator] === 'function') {
                for (var _msg of messages) {
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
            deasync.sleep(800);
        }

        if (!msg) {
            throw new OxError(errHelper.errorCode.TWILIO_ERROR, "Couldn't get the SMS within " + timeout + 'ms.');
        }

        if (removeOnRead) {
            await this._client.messages(msg.sid).remove();
        }

        return msg.body;
    }

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
    async sendSms(from, to, message) {
        utils.assertArgumentNonEmptyString(from, 'from');
        utils.assertArgumentNonEmptyString(to, 'to');
        utils.assertArgumentNonEmptyString(message, 'message');

        var msg;
        try {
            msg = await this._client.messages.create({
                body: message,
                from: from,
                to: to
            });
        } catch (e) {
            if (e.message) {
                var errorTxt = e.message;
                if (e.moreInfo) {
                    errorTxt += ' For more info: ' + e.moreInfo;
                } else if (e.code) {
                    errorTxt = 'Unable to connect to Twilio: ' + errorTxt;
                }
                throw new OxError(errHelper.errorCode.TWILIO_ERROR, errorTxt);
            }
        }

        return msg.sid;
    }

    async call(from, to) {
        utils.assertArgumentNonEmptyString(from, 'from');
        utils.assertArgumentNonEmptyString(to, 'to');

        var response = await this.httpRequest('POST', this._bridgeUrl + BRIDGE_CALL_NEW,
            {
                accountSid: this._accountSid,
                authToken: this._authToken,
                toNumber: to,
                fromNumber: from
            });

        //console.log(JSON.stringify(response, null,2 ));
        return response;
    }

    async httpRequest(method, url, body) {
        var opts = {
            url: url,
            method: method,
            form: body,
            json: true,
            timeout: BRIDGE_RESPONSE_TIMEOUT,
            rejectUnauthorized: false
        };

        const requestPromise = util.promisify(request);
        try {
            const response = await requestPromise(opts);
            if ((response.statusCode < 200 || response.statusCode >= 300)) {
                const msg = response.statusCode ? 'Status Code - ' + response.statusCode + ' ' + response.error : 'Error - ' + JSON.stringify(response);
                throw new OxError(errHelper.errorCode.TWILIO_ERROR, 'Error executing bridge command. ' + msg);
            }
            return response;
        } catch (e) {
            if (e instanceof OxError) {
                throw e;
            }
            throw new OxError(errHelper.errorCode.TWILIO_ERROR, "Couldn't connect to the bridge. " + e);
        }
    }
}
