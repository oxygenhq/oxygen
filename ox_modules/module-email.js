/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for working with email.
 */

const OxError = require('../errors/OxygenError');
var errHelper = require('../errors/helper');

module.exports = function(argv, context, rs) {
    var imaps = require('imap-simple');
    var deasync = require('deasync');

    var _config;

    module.init = function(user, password, host, port, tls, authTimeout) {
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
     * @param {String} timeout - Timeout for waiting for the message to arrive.
     * @return {Object} Email body and TO, FROM, SUBJECT, DATE headers.
     */
    module.getLastEmail = function(sinceMinutes, subject, timeout) {
        var mail;
        var now = (new Date()).getTime();
        
        while (!mail && ((new Date()).getTime() - now) < timeout) {
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
                            if (subject instanceof RegExp) {
                                if (subject.test(result.parts[0].body.subject[0])) {
                                    mail = {
                                        from: result.parts[0].body.from[0],
                                        to: result.parts[0].body.to[0],
                                        subject: result.parts[0].body.subject[0],
                                        date: result.parts[0].body.date[0],
                                        body: result.parts[1].body
                                    };
                                    break;
                                }
                            } else {
                                if (subject === result.parts[0].body.subject[0]) {
                                    mail = {
                                        from: result.parts[0].body.from[0],
                                        to: result.parts[0].body.to[0],
                                        subject: result.parts[0].body.subject[0],
                                        date: result.parts[0].body.date[0],
                                        body: result.parts[1].body
                                    };
                                    break;
                                }
                            }
                        }
                    });
                });
            });

            deasync.sleep(500);
        }

        if (!mail) {
            throw new OxError(errHelper.errorCode.TIMEOUT, "Couldn't get an email within " + timeout + 'ms.');
        }

        return mail;
    };

    return module;
};
