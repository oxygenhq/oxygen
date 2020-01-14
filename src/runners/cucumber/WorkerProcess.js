import { fork } from 'child_process';
import { EventEmitter } from 'events';
import { defer } from 'when';

// setup logger
import logger from '../../lib/logger';
const log = logger('WorkerProcess');

import Debugger from '../../lib/debugger';
import oxutil from '../../lib/util';

// snooze function - async wrapper around setTimeout function
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * WorkerProcess responsible for spawning a worker process the test instance.
 */
export default class WorkerProcess extends EventEmitter {
    constructor(pid, workerPath, debugMode, debugPort) {
        super();
        this._isRunning = false;
        this._isInitialized = false;
        this._stoppedByUser = true;
        this._pid = pid;
        this._childProc = null;
        this._debugMode = debugMode;
        this._debugPort = debugPort;
        this._workerPath = workerPath;
        // hold the remote invocation promise
        this._calls = {};
    }
    async start() {
        const env = Object.assign(process.env, {
            OX_WORKER: true,
            DEBUG: !isNaN(this._debugPort)
        });

        log.info(`Starting worker process ${this._pid}.`);
        let forkOpts = { 
            cwd: process.cwd(), 
            env,
            execArgv: [],
            detached: false,
            //silent: false
        };
        if (this._debugPort) {
            // add --inspect-brk argument if debug port is specified
            forkOpts.execArgv = Object.assign(forkOpts.execArgv, ['--inspect-brk=' + this._debugPort]);
        }      
        // fork worker
        this._childProc = fork(this._workerPath, forkOpts);
        
        this._hookChildProcEvents();
        // if we are in debug mode, initialize debugger and only then start modules 'init'
        if (this._debugMode) {
            await this._initializeDebugger();
        }
        this._isRunning = true;
        return this._childProc;
    }

    async stop() {
        if (this._childProc) {
            this._childProc.kill('SIGINT');
            await snooze(100);
        }        
        if (this._debugger) {                        
            await this._debugger.close();
        }
        this._reset();
    }

    async init(rid, options) {
        if (!this._isInitialized) {
            const beforeTime = new Date().getTime();
            await this._invoke('init', rid, options);    
            const afterTime = new Date().getTime();    
            const duration = afterTime - beforeTime;    
            this._isInitialized = true;
            console.log('Worker initialized in ' + duration + ' ms');
        }        
    }

    async dispose() {
        if (this._isInitialized && this._childProc) {               
            await this._invoke('dispose');
        }
    }

    async disposeModules() {
        if (this._isInitialized && this._childProc) {               
            await this._invoke('disposeModules');
        }
    }

    async emitUserHook(hookName, hookArgs) {
        return await this._invoke(hookName, hookArgs);
    }

    get debugger () {
        return this._debugger;
    }

    get isRunning () {
        return this._isRunning;
    }
    
    get isInitialized() {
        return this._isInitialized;
    }

    async run(caps) {
        await this._invoke('run', caps);
    }

    async _invoke(method) {
        let args = Array.prototype.slice.call(arguments);
        // ignore first argument - e.g. method 
        if (args.length > 0) {
            args.shift();
        }
        if (this._childProc) {
            const callId = oxutil.generateUniqueId();
            this._send({
                type: 'invoke',
                method: method,
                callId: callId,
                args: args
            });
            this._calls[callId] = defer();
            return this._calls[callId].promise;
        }        
    }

    _send(message) {
        if (!this._childProc) {
            return false;
        }
        this._childProc.send(message);
        return true;
    }

    _reset() {
        this._childProc = null;
        this._debugger = null;
        this._isRunning = false;
        this._debugMode = null;
        this._debugPort = null;
        this._whenOxygenDisposed = null;
        this._whenOxygenInitialized = null;
        this._whenModulesDisposed = null;
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

    _handleChildMessage(msg) {
        if (msg.event) {
            switch (msg.event) {               
                case 'invoke:result':
                    msg.callId && Object.prototype.hasOwnProperty.call(this._calls, msg.callId) && this._calls[msg.callId].resolve(msg.retval);
                    delete this._calls[msg.callId];
                    break;
                case 'invoke:error':
                    msg.callId && Object.prototype.hasOwnProperty.call(this._calls, msg.callId) && this._calls[msg.callId].reject(msg.error);
                    delete this._calls[msg.callId];
                    break;
            }
        }
        this.emit('message', Object.assign(msg, { pid: this._pid }));
    }

    _handleChildError(error) {
        log.debug(`Worker ${this._pid} thrown an error: ${error}.`);
        this.emit('error', Object.assign(error, { pid: this._pid }));
    }

    _handleChildExit(exitCode, signal) {
        log.debug(`Worker ${this._pid} finished with exit code ${exitCode} and signal ${signal}.`);
        this._reset();
        this.emit('exit', { pid: this._pid, exitCode, signal });
    }

    _handleChildDisconnect() {
        log.debug(`Worker ${this._pid} disconnected.`);
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
        this._debugger.on('break', function(breakpointData) {
            this.emit('debugger:break', breakpointData);
        });
        this._debugger.on('breakError', async function(breakError) {

            const error = new Error(breakError);

            _this.emit('error', Object.assign({ error : error }, { pid: this._pid }));
            _this.emit('exit', { pid: this._pid, exitCode: 1 });
        });

        try{
            // connect to Chrome debugger
            await this._debugger.connect(this._debugPort, '127.0.0.1');
        } catch(e){
            log.error('Cannot connect to the debugger: ', e);
            throw e;
        }


        return whenDebuggerReady.promise;
    }
}