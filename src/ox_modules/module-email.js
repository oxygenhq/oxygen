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
import _ from 'lodash';
var errHelper = require('../errors/helper');

module.exports = function() {
    var imaps = require('imap-simple');
    const simpleParser = require('mailparser').simpleParser;
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
     * @param {Boolean=} enableSNI - Enable sending SNI when establishing the connection. This is required for some mail servers. Default is false. 
     */
    module.init = function(user, password, host, port, tls, authTimeout, enableSNI) {
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

        // set servername if SNI is enabled or we are using Gmail
        if (enableSNI || host === 'imap.gmail.com') {
            _config.imap.tlsOptions = { servername: host };
        }
    };

    /**
     * @summary Retrieves last unseen email.
     * @function getLastEmail
     * @param {Number} sinceMinutes - Search for emails received since the specified amount of minutes into past.
     * @param {String|Regex} subject - Return email matching the specified subject.
     * @param {Number} timeout - Timeout (in milliseconds) for waiting for the message to arrive.
     * @return {Object} Email body, text, textAsHtml, attachments if any, and TO, FROM, SUBJECT, DATE headers.
     * @example <caption>[javascript] Usage example</caption>
     * email.init('[YOUR_EMAIL]@gmail.com', 'password', 'imap.gmail.com', 993, true, 3000);
     * var mail = email.getLastEmail(60, 'email subject', 5000);
     * log.info(mail);
     * 
     * if(r.attachments && r.attachments.length > 0){
     * 	const fs = require('fs');
     * 	r.attachments.map((attachment) => {
     * 		let fileDescriptor;
     * 		try{
     * 			fileDescriptor = fs.openSync(attachment.filename, 'w');
     * 		} catch(e) {
     * 			throw 'could not open file: ' + e;
     * 		}
     * 		
     * 		try{
     * 			fs.writeFileSync(fileDescriptor, attachment.data);
     * 		} catch(e) {
     * 			throw 'error writing file: ' + e;
     * 		}
     * 		
     * 		fs.closeSync(fileDescriptor);
     * 	});
     * }
     */
    module.getLastEmail = async function(sinceMinutes, subject, timeout) {
        utils.assertArgumentNumberNonNegative(sinceMinutes, 'sinceMinutes');
        utils.assertArgumentNumberNonNegative(timeout, 'timeout');

        var mail;
        var now = (new Date()).getTime();
        var err;

        while (!err && !mail && ((new Date()).getTime() - now) < timeout) {
            try {
                const connection = await imaps.connect(_config);
                await connection.openBox('INBOX');

                // fetch unseen emails from the last sinceMinutes
                var startDate = new Date();
                startDate.setTime(Date.now() - (sinceMinutes * 60 * 1000));
                startDate = startDate.toISOString();
                var searchCriteria = ['UNSEEN', ['SINCE', startDate]];

                // fetch certain headers and stripped down body
                var fetchOptions = {
                    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                    struct: true,
                    markSeen: false
                };

                const results = await connection.search(searchCriteria, fetchOptions);

                for (var result of results) {
                    const headerPart = _.find(result.parts, { 'which': fetchOptions.bodies[0] });
                    const bodyPart = _.find(result.parts, { 'which': fetchOptions.bodies[1] });

                    const id = result.attributes.uid;
                    const idHeader = 'Imap-Id: '+id+'\r\n';
                    const simple = await simpleParser(idHeader+bodyPart.body);
                    const attachments = [];
                    const parts = imaps.getParts(result.attributes.struct);

                    for (const part of parts) {
                        if (part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT') {
                            const partData = await connection.getPartData(result, part);
                            attachments.push({
                                filename: part.disposition.params.filename,
                                data: partData
                            });
                        }
                    }

                    let body;
                    let html;
                    let textAsHtml;
                    if (simple.html || simple.text || simple.textAsHtml) {
                        // parsed success
                        body = bodyPart.text;
                        html = simple.html;
                        textAsHtml = simple.textAsHtml;
                    } else {
                        // don't parsed
                        body = bodyPart.body;
                    }

                    if (headerPart) {
                        if (
                            subject && (
                                (subject.constructor.name === 'RegExp' && subject.test(headerPart.body.subject[0])) ||
                                (subject === headerPart.body.subject[0])
                            )
                        ) {
                            let to = headerPart.body.to ? headerPart.body.to[0] : null;

                            mail = {
                                from: headerPart.body.from[0],
                                to: to,
                                subject: headerPart.body.subject[0],
                                date: headerPart.body.date[0],
                                body: body,
                                attachments: attachments,
                                textAsHtml: textAsHtml,
                                html: html
                            };
                        }
                    }
                }
            } catch (e) {
                err = e;
            }
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
