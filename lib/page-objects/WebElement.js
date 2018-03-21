const Element = require('./Element');

 class WebElement extends Element {
    constructor(context, modules, locators, label, type) {
        super(context, modules.web, locators, label, type);
    }
}

module.exports = WebElement;