export default class OxygenService {
    //return new ServiceClass(this.opts, this.ctx, this.resultStore, logger);
    constructor(options, ctx, results, logger) {
        this.options = options;
        this.ctx = ctx;
        this.results = results;
        this.logger = logger;
        this.isInitialized = false;
    }
    init() {
        this.isInitialized = true;
    }
    dispose() {
        this.isInitialized = false;
    }
    onModuleLoaded(module) {

    }
    onModuleInitialized(module) {

    }
    onModuleWillDispose(module) {
        
    }
    onTestStart(test) {

    }
    onTestEnd(test) {

    }
}