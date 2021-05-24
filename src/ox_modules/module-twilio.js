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

// FIXME: find good timeout
const BRIDGE_RESPONSE_TIMEOUT = 600 * 1000;

export default class TwilioModule extends OxygenModule {

    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);

        this._client = null;
        this._callSid = null;
        this._callIsRecorded = false;
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

    // FIXME: liveAudioStream
    /**
     * @summary Initiate a call
     * @function call
     * @param {String} from - Phone number to call from.
     * @param {String} to - Phone number to call.
     * @param {Number} timeout - Limit in seconds to wait for the call to be answered. Default is 30 seconds.
     * @param {Boolean} record - Specifies whether to record the call or not.
     * @param {String=} liveAudioStream - Specifies WebSocket address to receive live audio stream of the call.
     * @return {String} Call SID.
     * @example <caption>[javascript] Usage example</caption>
     * twilio.init('Account Sid', 'Account Token', 'http://bridge_url');
     * twilio.call('+1xxxxxxxxxx', '+972xxxxxxxxx', 40, true, false);
     */
    async call(from, to, timeout, record, liveAudioStream) {
        utils.assertArgumentNonEmptyString(from, 'from');
        utils.assertArgumentNonEmptyString(to, 'to');
        utils.assertArgumentBool(record, 'record');
        if (typeof(timeout) !== 'number' || timeout < 1 || timeout > 600 ) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + timeout + "' should be between 1 and 600 seconds.");
        }

        if (liveAudioStream) {
            // TODO: dispose
            const WebSocket = require('ws');
            const wss = new WebSocket.Server({ port: 3001 });

            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    console.log('WS message: ', message);
                });

                ws.on('close', function incoming() {
                    console.log('WS close');
                });

                ws.on('error', function incoming(error) {
                    console.log('WS error: ', error);
                });
            });
        }

        var response = await this.httpRequest('POST', `${this._bridgeUrl}/calls/new`,
            {
                accountSid: this._accountSid,
                authToken: this._authToken,
                toNumber: to,
                fromNumber: from,
                record: record,
                liveAudioStreamWSS: liveAudioStream ? 'wss://TODO' : null,
                timeout: timeout
            });

        this._callSid = response.body.sessionId;
        this._callIsRecorded = record;

        return response.body.sessionId;
    }

    /**
     * @summary Wait for the call to be answered
     * @function waitForAnswer
     */
    async waitForAnswer() {
        this.assertCallSid();

        var response = await this.httpRequest('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/wait/answer`);

        if (!response.body.success) {
            if (response.body.error === 'no-answer') {
                throw new OxError(errHelper.errorCode.TWILIO_ERROR, 'The called party did not answer.');
            } else if (response.body.error === 'busy') {
                throw new OxError(errHelper.errorCode.TWILIO_ERROR, 'The line is busy.');
            }
        }
    }

    /**
     * @summary Wait for the specified speech to be heard over the line.
     * @function waitForSpeech
     * @param {String} text - Text to wait for.
     * @param {String} language - Speech language. Default is en-US. See https://www.twilio.com/docs/voice/twiml/gather#languagetags for a list of supported languages.
     * @param {Integer} timeout - Stop listening to the speech after the specified amount of second.
     */
    async waitForSpeech(text, language = 'en-US', timeout) {
        utils.assertArgumentNumberNonNegative(timeout, 'timeout');
        this.assertCallSid();

        var response = await this.httpRequest('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/wait/speech`,
            {
                textToSpeech: text,
                language: language,
                timeout: timeout
            });

        if (!response.body.success) {
            var msg = "The specified speech wasn't received.";
            if (response.body.outcome) {
                msg += ' Received instead: ' + response.body.outcome;
            }
            throw new OxError(errHelper.errorCode.TWILIO_ERROR, msg);
        }
    }

    /**
     * @summary Speak
     * @function speak
     * @param {String} text - Text to speak.
     * @param {String=} language - Language to use: en, en-gb, es, fr, de. Default is en.
     */
    async speak(text, language = 'en') {
        this.assertCallSid();

        // about supported languages: https://www.twilio.com/docs/voice/twiml/say?code-sample=code-say-verb-defaulting-on-alices-voice&code-language=Node.js&code-sdk-version=3.x#attributes-manwoman
        if (!['en', 'en-gb', 'es', 'fr', 'de'].includes(language)) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - 'language'. Should be one of: en, en-gb, es, fr, de.");
        }

        var response = await this.httpRequest('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/input/speech`,
            {
                textToSpeech: text,
                language: language
            });
        return response;
    }

    /**
     * @summary Input DTMF tones.
     * @function inputDigits
     * @param {String} digits - DTMF tones to send: `1234567890#*`. `w` can be used to produce a 0.5 seconds pause.
     */
    async inputDigits(digits) {
        this.assertCallSid();

        if (!/^[1234567890*#w]+$/.test(digits)) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - 'digits'. Should contain only '1234567890*#w' characters.");
        }

        var response = await this.httpRequest('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/input/digits`,
            {
                digits: digits
            });
        return response;
    }

    /**
     * @summary Hangup currently active call
     * @function hangup
     */
    async hangup() {
        this.assertCallSid();
        await this.httpRequest('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/hangup`);
        this._callSid = null;
    }

    /**
     * @summary Play an audio file over the line.
     * @function playAudio
     * @param {String} url - URL of the audio file. Supported formats: mp3, wav, x-wav, aiff, gsm, ulaw.
     * @example <caption>[javascript] Usage example</caption>
     * twilio.init('Account Sid', 'Account Token');
     * twilio.call('+1xxxxxxxxxx', '+972xxxxxxxxx');
     * twilio.waitForAnswer();
     * twilio.playAudio('https://api.twilio.com/cowbell.mp3');
     */
    async playAudio(url) {
        utils.assertArgumentNonEmptyString(url, 'url');
        this.assertCallSid();

        var response = await this.httpRequest('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/input/audio`,
            {
                url : url
            });
        return response;
    }

    async onAfterCase() {
        await this.httpRequestSilent('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/hangup`);

        if (this._callIsRecorded) {
            const response = await this.httpRequestSilent('POST', `${this._bridgeUrl}/calls/${this._callSid}/op/get/recording`);
            if (response && response.statusCode === 200 && response.body) {
                global.ox.ctx.audio = { url: response.body };
            }
        }
        this._callSid = null;
        this._callIsRecorded = false;
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
                const msg = response.body ? `${response.statusCode} (${response.body.message})` : response.statusCode;
                throw new OxError(errHelper.errorCode.TWILIO_ERROR, 'Error executing bridge command: ' + msg);
            }
            return response;
        } catch (e) {
            if (e instanceof OxError) {
                throw e;
            }
            throw new OxError(errHelper.errorCode.TWILIO_ERROR, "Couldn't connect to the bridge. " + e);
        }
    }

    async httpRequestSilent(method, url) {
        var opts = {
            url: url,
            method: method,
            json: true,
            timeout: BRIDGE_RESPONSE_TIMEOUT,
            rejectUnauthorized: false
        };

        const requestPromise = util.promisify(request);
        try {
            return await requestPromise(opts);
        } catch (e) {
            // ignored
        }
    }

    assertCallSid() {
        if (!this._callSid) {
            throw new OxError(errHelper.errorCode.TWILIO_ERROR, 'There are no currently active calls. Use `call` command to initiate a call.');
        }
    }
}
