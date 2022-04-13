/* eslint-disable no-unreachable */
import WDIODevToolsService from '@wdio/devtools-service';

import OxygenService from '../core/OxygenService';
import NetworkSubModule from './service-devtools/submodule-network';

const CHROME_BROWSER = 'chrome';

export default class DevToolsService extends OxygenService {
    constructor(options, ctx, results, logger) {
        super(options, ctx, results, logger);
        // hash of webdriver based modules
        this._subModules = {};
        this.isServiceInitialized = true;
    }
    onModuleLoaded(module) {
        // skip any module that does not implement .getDriver() method (e.g. not webdriver based)
        if (!module || !module.getDriver || typeof module.getDriver !== 'function' || !module.getCapabilities || typeof module.getCapabilities !== 'function') {
            return;
        }

        const networkSubmodule = new NetworkSubModule('network', module);
        module.addSubModule('network', networkSubmodule);
        this._subModules[module.name] = networkSubmodule;
    }
    async onModuleInitialized(module) {
        // skip any module that does not implement getDriver method (e.g. not webdriver based)
        if (!module || !module.getDriver || typeof module.getDriver !== 'function' || !module.getCapabilities || typeof module.getCapabilities !== 'function') {
            return;
        }
        const submodule = this._subModules[module.name];
        if (!submodule || submodule.isInitialized) {
            return;
        }

        let options = {};
        const capabilities = module.getCapabilities() || {};
        const { browserName } = capabilities;
        this._driver = module.getDriver();

        if (
            this._driver &&
            this._driver.capabilities &&
            this._driver.capabilities['goog:chromeOptions'] &&
            this._driver.capabilities['goog:chromeOptions']['debuggerAddress']
        ) {
            options.debuggerAddress = this._driver.capabilities['goog:chromeOptions']['debuggerAddress'];
        }

        // if we are not using any 3rd party provider
        if (this._driver.provider === null && browserName && browserName.toLowerCase() === CHROME_BROWSER) {
            // initialize DevToolsService and hook it to the current webdriver object
            const devToolsSvc = new WDIODevToolsService(options);
            const UNSUPPORTED_ERROR_MESSAGE = devToolsSvc.beforeSession(null, capabilities);

            if (UNSUPPORTED_ERROR_MESSAGE) {
                console.log('UNSUPPORTED_ERROR_MESSAGE', UNSUPPORTED_ERROR_MESSAGE);
            }

            if (devToolsSvc._isSupported) {
                // change global.browser to the current module's webdriver instance
                // const orgGlobalBrowser = global.browser;
                global.browser = module.getDriver();
                await devToolsSvc.before(null, null, this._driver);
                submodule.init(devToolsSvc);
                // global.browser = orgGlobalBrowser;
            }
        }
    }
    onModuleWillDispose(module) {
        const submodule = this._subModules[module.name];
        if (!submodule) {
            return;
        }
        submodule.dispose();
    }
}