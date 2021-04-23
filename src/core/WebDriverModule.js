import OxygenModule from './OxygenModule';

export default class WebDriverModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this.driver = null;
        this.caps = null;

        console.log('~~WebDriverModule this.driver', this.driver);

        process.send({
            event: 'repl',
            name: 'repl_canStart',
        });

        process.on('message', async(m) => {
            if (m.event !== 'repl') {
                return;
            }

            if (m.name === 'start') {
                this.replStart();
            }
        });
    }
    getDriver() {
        return this.driver;
    }
    getCapabilities() {
        return this.caps;
    }
    async replStart(commandTimeout = 5000) {
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

        return new Promise((resolve) => (commandResolve = resolve));
    }
    async replEval (cmd) {
        const serialize_error = require('serialize-error');
        await this.repl.eval(cmd, global, null, (e, result) => {
            if (e) {
                process.send({
                    event: 'repl',
                    name: 'repl_result',
                    params: {
                        error: true,
                        ...serialize_error.serializeError(e)
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