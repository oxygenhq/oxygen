import OxygenModule from './OxygenModule';

export default class WebDriverModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this.driver = null;
        this.caps = null;
    }
    getDriver() {
        return this.driver;
    }
    getCapabilities() {
        return this.caps;
    }
}