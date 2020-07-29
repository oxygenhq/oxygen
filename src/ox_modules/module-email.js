/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name email
 * @description Provides methods for working with email via IMAP.
 */

import OxError from '../errors/OxygenError';
import utils from './utils';
var errHelper = require('../errors/helper');

module.exports = function() {
    var imaps = require('imap-simple');
    var deasync = require('deasync');

    var _config;

    module.isInitialized = function() {
        return _config !== undefined;
    };

    /**
     * @summary Set email connection details.
     * @function init
     * @param {String} user - Username (e.g. 'your@email.address').
     * @param {String} password - Password.
     * @param {String} host - Host name (e.g. 'imap.gmail.com').
     * @param {Number} port - Port number (e.g. 993).
     * @param {Boolean} tls - true to use TLS, false otherwise.
     * @param {Number} authTimeout - Authentication timeout in milliseconds.
     */
    module.init = function(user, password, host, port, tls, authTimeout) {
        utils.assertArgumentNonEmptyString(user, 'user');
        utils.assertArgumentNonEmptyString(password, 'password');
        utils.assertArgumentNonEmptyString(host, 'host');
        utils.assertArgumentNumberNonNegative(port, 'port');
        utils.assertArgumentBool(tls, 'tls');
        utils.assertArgumentNumberNonNegative(authTimeout, 'authTimeout');

        _config = {
            imap: {
                user: user,
                password: password,
                host: host,
                port: port,
                tls: tls,
                authTimeout: authTimeout
            }
        };
    };

    /**
     * @summary Retrieves last unseen email.
     * @function getLastEmail
     * @param {Number} sinceMinutes - Search for emails received since the specified amount of minutes into past.
     * @param {String|Regex} subject - Return email matching the specified subject.
     * @param {Number} timeout - Timeout (in milliseconds) for waiting for the message to arrive.
     * @return {Object} Email body and TO, FROM, SUBJECT, DATE headers.
     * @example <caption>[javascript] Usage example</caption>
     * email.init('[YOUR_EMAIL]@gmail.com', 'password', 'imap.gmail.com', 993, true, 3000);
     * var mail = email.getLastEmail(60, 'email subject', 5000);
     * log.info(mail);
     */
    module.getLastEmail = function(sinceMinutes, subject, timeout) {
        utils.assertArgumentNumberNonNegative(sinceMinutes, 'sinceMinutes');
        utils.assertArgumentNumberNonNegative(timeout, 'timeout');

        var mail;
        var now = (new Date()).getTime();
        var err;

        while (!err && !mail && ((new Date()).getTime() - now) < timeout) {
            var done = false;
            imaps.connect(_config).then(function (connection) {
                return connection.openBox('INBOX').then(function () {
                    // fetch unseen emails from the last sinceMinutes
                    var startDate = new Date();
                    startDate.setTime(Date.now() - (sinceMinutes * 60 * 1000));
                    startDate = startDate.toISOString();
                    var searchCriteria = ['UNSEEN', ['SINCE', startDate]];

                    // fetch certain headers and stripped down body
                    var fetchOptions = {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', '1'],
                        markSeen: false
                    };

                    return connection.search(searchCriteria, fetchOptions).then(function (results) {
                        for (var result of results) {
                            if (subject.constructor.name === 'RegExp') {
                                if (subject.test(result.parts[0].body.subject[0])) {
                                    let to = result.parts[0].body.to ? result.parts[0].body.to[0] : null;
                                    mail = {
                                        from: result.parts[0].body.from[0],
                                        to: to,
                                        subject: result.parts[0].body.subject[0],
                                        date: result.parts[0].body.date[0],
                                        body: result.parts[1].body
                                    };
                                }
                            } else {
                                if (subject === result.parts[0].body.subject[0]) {
                                    let to = result.parts[0].body.to ? result.parts[0].body.to[0] : null;
                                    mail = {
                                        from: result.parts[0].body.from[0],
                                        to: to,
                                        subject: result.parts[0].body.subject[0],
                                        date: result.parts[0].body.date[0],
                                        body: result.parts[1].body
                                    };
                                }
                            }
                        }
                        done = true;
                    });
                });
            }).catch(function (e) {
                err = e;
            });

            deasync.loopWhile(() => !done && !err);
            deasync.sleep(500);
        }

        if (err) {
            throw new OxError(errHelper.errorCode.EMAIL_ERROR, err.toString());
        } else if (!mail) {
            throw new OxError(errHelper.errorCode.TIMEOUT, "Couldn't get an email within " + timeout + ' ms.');
        }

        return mail;
    };

    return module;
};
