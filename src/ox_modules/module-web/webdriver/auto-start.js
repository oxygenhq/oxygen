
import { ChromeWebDriverManager } from './ChromeWDM';

export async function autoStartWebDriver(caps, options = {}) {
    const browserName = caps.browserName || 'chrome';
    /* if (!caps.browserName) {
        return undefined;
    } */
    const wdManager = initWebDriverManager(browserName, options);
    if (wdManager) {
        return await wdManager.start();
    }
    return undefined;
}

function initWebDriverManager(browserName, options) {
    if (browserName === 'chrome') {
        return new ChromeWebDriverManager(options);
    }
}
