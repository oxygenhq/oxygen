import OxygenModule from './OxygenModule';
import OxError from '../errors/OxygenError';
const errHelper = require('../errors/helper');

export default class WebDriverModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this.driver = null;
        this.caps = null;
        this.replExecuted = false;
    }
    init(driver) {
        this.driver = driver;

        process.send({
            event: 'repl',
            name: 'repl_canStart',
            value: true
        });

        process.on('message', async(m) => {
            if (m.event !== 'repl') {
                return;
            }

            if (m.name === 'repl_start' && this.driver) {
                await this.replStart();
            }
        });

        super.init();
    }
    dispose() {
        process.send({
            event: 'repl',
            name: 'repl_canStart',
            value: false
        });
        super.dispose();
    }
    getDriver() {
        return this.driver;
    }
    getCapabilities() {
        return this.caps;
    }
    async replStart(commandTimeout = 5000) {
        if (this.replExecuted) {
            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, 'debug command can be used only once');
        }
        const wdioRepl = require('@wdio/repl');
        this.repl = new wdioRepl.default();

        const { introMessage } = this.repl;

        const context = {
            browser: this.driver,
            driver: this.driver,
            $: this.driver.$.bind(this.driver),
            $$: this.driver.$$.bind(this.driver)
        };
        await this.repl.start(context);

        process._debugProcess(process.pid);
        process.send({
            event: 'repl',
            name: 'repl_started',
            params: { commandTimeout, introMessage }
        });
        let commandResolve = () => { };
        process.on('message', async(m) => {
            if (m.event !== 'repl') {
                return;
            }
            if (m.name === 'repl_stop') {
                process._debugEnd(process.pid);
                return commandResolve();
            }
            if (m.name === 'repl_eval') {
                await this.replEval(m.content.cmd);
            }
        });

        this.replExecuted = true;
        return new Promise((resolve) => (commandResolve = resolve));
    }
    async replEval (cmd) {
        const serialize_error = require('serialize-error');
        await this.repl.eval(cmd, global, null, (e, result) => {
            if (e) {
                const serialized_err = serialize_error.serializeError(e);
                const err = new OxError(serialized_err);
                let message = '';

                if (err.type && err.type.type) {
                    message = err.type.type + ' - ' + err.type.message;
                } else {
                    message = err.type.message;
                }

                process.send({
                    event: 'repl',
                    name: 'repl_result',
                    params: {
                        error: true,
                        message: message
                    }
                });
            }
            if (typeof result === 'function') {
                result = `[Function: ${result.name}]`;
            }
            process.send({
                event: 'repl',
                name: 'repl_result',
                params: { result }
            });
        });
    }
}