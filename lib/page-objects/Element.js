module.exports = class Element {
    constructor(context, module, locators, label, type) {
        this.locators = locators || [];
        this.context = context || null;
        this.module = module || null;
        this.label = label || null;
        this.type = type || null;
    }
    waitForExist() {
        this.locators.forEach((locator, index) => {
            try {
                if (this.module.waitForExist) {
                    this.module.waitForExist(locator);
                }
                else if (this.module.waitForElement) {
                    this.module.waitForElement(locator);
                }
                return true;
            }
            catch (e) {
                // if last locator is reached and element still not found
                // then throw the exception
                if (index == this.locators.length - 1) {
                    throw e;
                }
            }
        });
        
    }
    waitForVisible() {
        this.locators.forEach((locator, index) => {
            try {
                this.module.waitForVisible(locator);
                return true;
            }
            catch (e) {
                // if last locator is reached and element still not found
                // then throw the exception
                if (index == this.locators.length - 1) {
                    throw e;
                }
            }
        });
        
    }
    setValue(value) {
        this.locators.forEach((locator, index) => {
            try {
                if (this.module.setValue) {
                    this.module.setValue(locator, value);    
                }
                else if (this.module.type) {
                    this.module.type(locator, value);    
                }
                return true;
            }
            catch (e) {
                // if last locator is reached and element still not found
                // then throw the exception
                if (index == this.locators.length - 1) {
                    throw e;
                }
            }
        });
        
    }
    click() {
        this.locators.forEach((locator, index) => {
            try {
                this.module.click(locator);
                return true;
            }
            catch (e) {
                // if last locator is reached and element still not found
                // then throw the exception
                if (index == this.locators.length - 1) {
                    throw e;
                }
            }
        });
        
    }
    waitForDisappear() {}
}