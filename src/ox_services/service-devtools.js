/* eslint-disable no-unreachable */
import WDIODevToolsService from '@wdio/devtools-service';

import OxygenService from '../core/OxygenService';
import NetworkSubModule from './service-devtools/submodule-network';

export default class DevToolsService extends OxygenService {
    constructor(options, ctx, results, logger) {
        super(options, ctx, results, logger);
        // hash of webdriver based modules
        this._subModules = {};
    }
    onModuleLoaded(module) {
        // skip any module that does not implement .getDriver() method (e.g. not webdriver based)
        if (!module || !module.getDriver || typeof module.getDriver !== 'function' || !module.getCapabilities || typeof module.getCapabilities !== 'function') {
            return;
        }

        // TODO: saucelabs integration throw error OI-667
        return;

        const networkSubmodule = new NetworkSubModule('network', module);
        module.addSubModule('network', networkSubmodule);
        this._subModules[module.name] = networkSubmodule;
    }
    async onModuleInitialized(module) {
        // skip any module that does not implement .getDriver() method (e.g. not webdriver based)
        if (!module || !module.getDriver || typeof module.getDriver !== 'function' || !module.getCapabilities || typeof module.getCapabilities !== 'function') {
            return;
        }
        const submodule = this._subModules[module.name];
        if (!submodule) {
            return;
        }
        // initialize DevToolsService and hook it to the current webdriver object
        const devToolsSvc = new WDIODevToolsService();
        devToolsSvc.beforeSession(null, module.getCapabilities());
        if (devToolsSvc.isSupported) {
            // change global.browser to the current module's webdriver instance
            const orgGlobalBrowser = global.browser;
            global.browser = module.getDriver();
            await devToolsSvc.before();
            submodule.init(devToolsSvc);
            global.browser = orgGlobalBrowser;
        }
    }
    onModuleWillDispose(module) {
        const submodule = this._subModules[module.name];
        if (!submodule) {
            return;
        }
        submodule.dispose();
        delete this._subModules[module.name];
    }
}