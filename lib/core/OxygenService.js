export default class OxygenService {
    constructor(options) {
        this.options = options;
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
    onTestStart(test) {

    }
    onTestEnd(test) {

    }
}