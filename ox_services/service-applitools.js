import { Eyes, Target } from '@applitools/eyes-webdriverio';

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
        if (!this.options.services || !this.options.services.some(x => x === 'applitools')) {
            return;
        }
        this._eyesConfig = this.options.applitoolsOpts;
        this._viewport = Object.assign(DEFAULT_VIEWPORT, this._eyesConfig.viewport || {})
        this._apiKey = this.options.applitoolsKey || this._eyesConfig.key || process.env.APPLITOOLS_KEY || null;        

        if (!this._apiKey) {
            throw new Error('To use Applitools service, you must specify Applitools API key in its service configuration section.')
        }

        super.init();
    }

    dispose() {
        super.dispose();
    }

    async check(name, target) {
        let result = true;
        if (this._webEyes) {
            result &= this._webEyes.check(name, target || Target.window().fully());
        }
        if (this._mobEyes) {
            result &= this._mobEyes.check(name, target || Target.window().fully());
        }
        return result;
    }

    async checkWindow(name, matchTimeout) {
        let result = true;
        if (this._webEyes) {
            result &= await this._webEyes.checkWindow(name, matchTimeout);
        }
        if (this._mobEyes) {
            result &= await this._mobEyes.checkWindow(name, matchTimeout);
        }
        return result;
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
        const appName = this.options.appName || this.options.name;
        if (module.name === 'web') {
            // initialize Eyes for web module
            this._webEyes = new Eyes();
            this._webEyes.setApiKey(this._apiKey);
            driver.call(() => this._webEyes.open(driver, this.options.name, appName, this.viewport));
        }
        else if (module.name === 'mob') {
            // initialize Eyes for mobile module
            this._mobEyes = new Eyes();
            this._mobEyes.setApiKey(this._apiKey);
            driver.call(() => this._mobEyes.open(driver, this.options.name, appName, this.viewport));
        }
    }

    onModuleWillDispose(module) {
        // this services works only with web and mobile modules
        if (module.name !== 'web' && module.name !== 'mob') {
            return;
        }
        if (!module.getDriver || typeof module.getDriver !== 'function') {
            return;
        }
        const driver = module.getDriver();
        if (!driver) {
            return;
        }
        if (module.name === 'web' && this._webEyes) {
            //this._webEyes.close();
            driver.call(this._webEyes.close.bind(this._webEyes));
            this._webEyes = null;
        }
        else if (module.name === 'mob' && this._mobEyes) {
            //driver.call(this._mobEyes.close.bind(this));
            this._mobEyes.close();
            this._mobEyes = null;
        }        
    }

}