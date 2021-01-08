/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name stomp
 * @description Provides methods for working with Stomp protocol over Web Socket
 */
import { EventEmitter } from 'events';
import { Client } from '@stomp/stompjs';
const WebSocket = require('ws');
// workaround to fix "WebSocket is not defined" issue
Object.assign(global, { WebSocket });

import OxygenModule from '../core/OxygenModule';

const MODULE_NAME = 'stomp';

export default class StompModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._lastResponse = null;
        this._brokerURL = null;
        this._attemptToConnect = false;
        this._connectPromiseResolve = null;
        this._connectPromiseReject = null;
        this._client = null;
        this._emmiter = new EventEmitter();
        // pre-initialize the module
        this._isInitialized = true;
    }

    /**
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "http".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Gets the base URL value that each request will be prefixed with
     * @function brokerUrl
     * @return {String} Base URL if was defined by the user.
     */
    get brokerUrl() {
        return this._brokerURL;
    }

    /**
     * @summary Sets the base URL value that each request will be prefixed with
     * @function setBrokerUrl
     * @param {String} url - Base URL.
     */
    setBrokerUrl(url) {
        this.brokerURL = url;
    }

    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    transaction(name) {
        global._lastTransactionName = name;
    }

    /**
     * @summary Connects to Stomp server
     * @function connect
     * @param {Object=} opts - Stomp options.
     */
    async connect(opts = {}, brokerUrl = null) {
        const clientOpts = {
            brokerURL: this.brokerUrl || brokerUrl,
            ...opts
        };
        if (opts.wsHeaders) {
            delete clientOpts['wsHeaders'];
            clientOpts.webSocketFactory = () => {
                return new WebSocket(brokerUrl, [], {
                    'headers': {
                        ...opts.wsHeaders
                    }
                });
            };
        }
        const client = new Client(clientOpts);
        this._client = client;
        this._attemptToConnect = true;

        client.onConnect = this._handleConnect.bind(this);
        client.onStompError = this._handleStompError.bind(this);
        client.onWebSocketError = this._handleWSError.bind(this);

        client.activate();
        return new Promise((resolve, reject) => { this._connectPromiseResolve = resolve; this._connectPromiseReject = reject; });
    }

    subscribe(destination, listener) {
        this._client.subscribe(destination, (message) => {
            let body = message.body;
            if (message && message.headers['content-type'] === 'application/json') {
                body = JSON.parse(message.body);
            }
            this._emmiter.emit('message', body);
            if (listener) {
                listener(body);
            }
        });
    }

    onEvent(event, listener) {
        return this._emmiter.on(event, listener);
    }

    removeListener(event, listener) {
        this._emmiter.removeListener(event, listener);
    }

    removeAllListeners(event) {
        this._emmiter.removeAllListeners(event);
    }

    _handleWSError(error) {
        console.log('onWebSocketError event: ', error);
        if (this._connectPromiseReject) {
            this._connectPromiseReject(error);
            this._resetConnectPromise();
        }
    }

    _handleConnect(frame) {
        // Do something, all subscribes must be done is this callback
        // This is needed because this will be executed after a (re)connect
        if (this._connectPromiseResolve) {
            this._connectPromiseResolve();
            this._resetConnectPromise();
        }
    }

    _handleStompError(frame) {
        // Will be invoked in case of error encountered at Broker
        // Bad login/passcode typically will cause an error
        // Complaint brokers will set `message` header with a brief message. Body may contain details.
        // Compliant brokers will terminate the connection after any error
        console.log('Broker reported error: ' + frame.headers['message']);
        console.log('Additional details: ' + frame.body);
        if (this._connectPromiseReject) {
            this._client.forceDisconnect();
            this._connectPromiseReject(frame);
            this._resetConnectPromise();
        }
    }

    _resetConnectPromise() {
        this._connectPromiseReject = this._connectPromiseResolve = null;
    }

}
