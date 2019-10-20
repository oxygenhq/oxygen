export default class OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        this._this = this;
        this.options = options;
        this.context = context;
        this.rs = rs;
        this.logger = logger;
        this.modules = modules;
        this.services = services;
        this.isInitialized = false;
    }
    init() {
        this.isInitialized = true;
    }
    dispose() {
        this.isInitialized = false;
    }
}