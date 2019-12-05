export class OxygenSubModule {
    constructor(name, parent) {
        this._name = name;
        this._parent = parent;
        this._isInitialized = false;
    }
    get name() {
        return this._name;
    }

    get parent() {
        return this._parent;
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
}