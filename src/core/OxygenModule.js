export default class OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        this._this = this;
        this.options = options;
        this.ctx = context;
        this.rs = rs;
        this.logger = logger;
        this.modules = modules;
        this.services = services;
        this._isInitialized = false;
    }
    get name() {
        throw Error('"name" property must be implemented by the deriving class');
    }
    get isInitialized() {
        return this._isInitialized;
    }
    init() {
        this._isInitialized = true;
    }
    dispose() {
        this._isInitialized = false;
    }
    onBeforeCase(suite, suiteIterationNum, caze, caseIterationNum) {

    }
    onAfterCase(suiteResult, caseResult) {
        
    }
    addCommand(name, func, thisArg) {
        if (!thisArg) {
            thisArg = this;
        }
        Object.defineProperty(Object.getPrototypeOf(this), name, {
            value: func.bind(thisArg)
        });
    }
    addSubModule(name, submodule) {
        Object.defineProperty(Object.getPrototypeOf(this), name, {
            value: submodule
        });
    }
}