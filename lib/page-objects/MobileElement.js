const Element = require('./Element');

 class MobileElement extends Element {
    constructor(context, modules, locators, label, type) {
        super(context, modules.mob, locators, label, type);
    }
}

module.exports = MobileElement;