import { fork } from 'child_process';
import { EventEmitter } from 'events';
import { defer } from 'when';
import path from 'path';

import Debugger from '../../lib/debugger';
import logger from '../../lib/logger';

// setup logger
const log = logger('WorkerProcess');

// snooze function - async wrapper around setTimeout function
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * WorkerProcess responsible for spawning a worker process the test instance.
 */
export default class WorkerProcess extends EventEmitter {
    constructor(pid, debugMode, debugPort) {
        super();
        this._isRunning = false;
        this._stoppedByUser = true;
        this._pid = pid;
        this._debugMode = debugMode;
        this._debugPort = debugPort;

        // setInterval(() => {
        //     console.log('---');
        //     console.log('!!this._debugger', !!this._debugger);
        //     console.log('_pid', this._pid);
        //     console.log('--- \n');
        // }, 5000);
    }
    async start() {
        const env = Object.assign(process.env, {
            OX_WORKER: true,
            DEBUG: !isNaN(this._debugPort)
        });

        log.info(`Starting worker process ${this._pid}.`);
        let forkOpts = { 
            cwd: process.cwd(), //__dirname,
            env,
            execArgv: [],
            //silent: true
        };
        if (this._debugPort) {
            // add --inspect-brk argument if debug port is specified
            forkOpts.execArgv = Object.assign(forkOpts.execArgv, ['--inspect-brk=' + this._debugPort]);
        }      
        // fork worker.js
        this._childProc = fork(path.join(__dirname, 'worker.js'), forkOpts);
        this._hookChildProcEvents();
        // if we are in debug mode, initialize debugger and only then start modules 'init'
        if (this._debugMode) {
            // delay debugger initialization, as debugger port might not be open yet right after the process fork
            await snooze(1000);
            await this._initializeDebugger();
        }
        this._isRunning = true;
        return this._childProc;
    }

    async stop() {
        if (this._debugger) {
            await this._debugger.close();
        }
        this._reset();

        if (!this._childProc) {
            return false;
        }
    }

    send(message) {
        if (!this._childProc) {
            return false;
        }
        this._childProc.send(message);
        return true;
    }

    get debugger () {
        return this._debugger;
    }

    get isRunning () {
        return this._isRunning;
    }

    _reset() {
        this._childProc = null;
        this._debugger = null;
        this._isRunning = false;
    }

    _hookChildProcEvents() {
        if (!this._childProc) {
            return;
        }
        this._childProc.on('message', this._handleChildMessage.bind(this));
        this._childProc.on('error', this._handleChildError.bind(this));
        this._childProc.on('exit', this._handleChildExit.bind(this));
        this._childProc.on('disconnect', this._handleChildDisconnect.bind(this));
        this._childProc.on('uncaughtException', this._handleChildUncaughtException.bind(this));
        this._childProc.on('SIGINT', this._handleChildSigInt.bind(this));
    }
    _handleChildMessage(message) {
        //log.debug(`Worker ${this._pid} got a message: ${message}.`);
        this.emit('message', Object.assign(message, { pid: this._pid }));
    }
    _handleChildError(error) {
        log.debug(`Worker ${this._pid} thrown an error: ${error}.`);
        this.emit('error', Object.assign(error, { pid: this._pid }));
    }
    _handleChildExit(exitCode, signal) {
        log.debug(`Worker ${this._pid} finished with exit code ${exitCode} and signal ${signal}.`);
        if(this._childProc && this._childProc.kill){
            this._childProc.kill('SIGTERM');
        }
        this._reset();
        this.emit('exit', { pid: this._pid, exitCode, signal });
    }
    _handleChildDisconnect() {
        log.debug(`Worker ${this._pid} disconnected.`);
        if (this._debugger) {
            log.debug(`Close Debugger`);
            this._debugger.close();
        } else {
            log.debug(`Looks like Debugger closed`);
        }
    }
    _handleChildUncaughtException(error) {
        log.debug(`Worker ${this._pid} thrown an uncaught error: ${error}.`);
        this._reset();
        this.emit('error', Object.assign(error, { pid: this._pid }));
        this.emit('exit', { pid: this._pid, exitCode: 1 });
    }
    _handleChildSigInt() {
        log.debug(`Worker ${this._pid} received SIGINT signal.`);
    }

    async _initializeDebugger() {
        this._debugger = new Debugger(this._pid);
        let whenDebuggerReady = defer();
        const _this = this;
        // handle debugger events     
        this._debugger.on('ready', function(err) {
            // resume the first breakpoint which is automatically added by the debugger
            _this._debugger.continue(); 
            whenDebuggerReady.resolve();
        });
        this._debugger.on('error', function(err) {
            this.emit('debugger:error', Object.assign(err, { pid: this._pid }));
            // reject the promise only if we got an error right after _debugger.connect() call below - we need this to indicate debugger initialization error
            if (!whenDebuggerReady.isResolved) {
                whenDebuggerReady.reject(err);
            }
        });
        this._debugger.on('break', function(breakpoint) {
            this.emit('debugger:break', Object.assign(breakpoint, { pid: this._pid }));
        });

        try{
            // connect to Chrome debugger
            await this._debugger.connect(this._debugPort, '127.0.0.1');
            /*await snooze(10000);
            await this._debugger.connect(this._debugPort, '127.0.0.1');*/
        } catch(e){
            log.error('Cannot connect to the debugger: ', e);
            throw e;
        }


        return whenDebuggerReady.promise;
    }
}