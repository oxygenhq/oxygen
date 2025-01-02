/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { Server } from 'socket.io';

const io = new Server({
    serveClient: false,
    pingInterval: 10000,
    pingTimeout: 60000,
    maxHttpBufferSize: 256 * 1024 * 1024, // 256MB
    cookie: true,
    cors: {
        origin: '*',
    },
    transports: ['websocket'],
});
/*
 * WebSocket Reporter
 */
export default class WebSocketReporter {
    constructor(aggregator) {
        this._aggregator = aggregator;
        this._hookAggregatorEvents();
    }
    startAndWaitForClient(serverPort) {
        io.listen(serverPort);
        return new Promise((resolve, reject) => {
            this._handleServerEvents(resolve);
        });
    }
    stop() {
        if (this._socket) {
            io.close();
            this._socket = undefined;
        }
    }
    _handleServerEvents(resolveWait) {
        const _this = this;
        io.on('connection', (socket) => {
            _this._handleSocketEvents(socket);
            resolveWait();
        });
    }
    _handleSocketEvents(socket) {
        this._socket = socket;
        socket.on('disconnect', (reason) => {
        });
        socket.on('error', (err) => {
            console.error('Error in Socket:', err);
        });
    }
    _hookAggregatorEvents() {
        this._aggregator.on('runner:start', e => this._handleRunnerStart(e));
        this._aggregator.on('runner:end', e => this._handleRunnerEnd(e));
        this._aggregator.on('suite:start', e => this._handleSuiteStart(e));
        this._aggregator.on('suite:end', e => this._handleSuiteEnd(e));
        this._aggregator.on('case:start', e => this._handleCaseStart(e));
        this._aggregator.on('case:end', e => this._handleCaseEnd(e));
        this._aggregator.on('log', e => this._handleLog(e));
    }
    _handleRunnerStart(event) {
        this._socket?.emit('runner:start', event);
    }
    _handleRunnerEnd(event) {
        this._socket?.emit('runner:end', event);
    }
    _handleSuiteStart(event) {
        this._socket?.emit('suite:start', event);
    }
    _handleSuiteEnd(event) {
        this._socket?.emit('suite:end', event);
    }
    _handleCaseStart(event) {
        this._socket?.emit('case:start', event);
    }
    _handleCaseEnd(event) {
        this._socket?.emit('case:end', event);
    }
    _handleStepStart(event) {
        this._socket?.emit('step:start', event);
    }
    _handleStepEnd(event) {
        this._socket?.emit('step:end', event);
    }
    _handleLog(event) {
        this._socket?.emit('log', event);
    }
}