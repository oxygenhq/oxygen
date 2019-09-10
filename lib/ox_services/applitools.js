import { Eyes, Target } from './node_modules/@applitools/eyes-webdriverio';

import OxygenService from '../lib/core/OxygenService';

const DEFAULT_VIEWPORT = {
    width: 1440,
    height: 900
};

export default class applitoolsService extends OxygenService {
    constructor(options) {
        super(options);
        this._eyesConfig = {};
        this._isInitialized = false;
        this._webEyes = null;
        this._mobEyes = null;
    }

    init() {        
        // if applitools service is not listed or has no configuration, ignore the init
        if (!options.services || !options.services.some(applitools)) {
            return;
        }
        this._eyesConfig = options.applitoolsOpts;
        this._viewport = Object.assign(DEFAULT_VIEWPORT, this.eyesConfig.viewport || {})
        const apiKey = options.applitoolsKey || this.eyesConfig.key || process.env.APPLITOOLS_KEY || null;        

        if (!apiKey) {
            throw new Error('To use Applitools service, you must specify Applitools API key in its service configuration section.')
        }
        // initialize Eyes for web module
        this._webEyes = new Eyes();
        this._webEyes.setApiKey(apiKey);
        // initialize Eyes for mobile module
        this._mobEyes = new Eyes();
        this._mobEyes.setApiKey(apiKey);

        super.init();
    }

    dispose() {
        super.dispose();
    }

    onModuleInitialized(module) {
        // this services works only with web and mobile modules
        if (module.name !== 'web' && module.name !== 'mob') {
            return;
        }
        // ignore modules that do not have getDriver method
        if (!module.getDriver || typeof module.getDriver !== 'function') {
            return;
        }
        const driver = module.getDriver();
        if (!driver) {
            return;
        }
        if (module.name === 'web') {
            driver.call(() => this.webEyes.open(driver, this.options.name, this.options.appName || null, this.viewport));
        }
        else if (module.name === 'mob') {
            driver.call(() => this.mobEyes.open(driver, this.options.name, this.options.appName || null, this.viewport));
        }
    }

    onModuleWillDispose(module) {
        // this services works only with web and mobile modules
        if (module.name !== 'web' && module.name !== 'mob') {
            return;
        }
        const driver = module.getDriver();
        if (!driver) {
            return;
        }
        if (module.name === 'web') {
            driver.call(this.webEyes.close.bind(this));
            this._webEyes = null;
        }
        else if (module.name === 'mob') {
            driver.call(this.mobEyes.close.bind(this));
            this._mobEyes = null;
        }        
    }

}