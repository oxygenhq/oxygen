
import { ChromeWebDriverManager } from './ChromeWDM';

export async function autoStartWebDriver(caps) {
    const browserName = caps.browserName || 'chrome';
    /* if (!caps.browserName) {
        return undefined;
    } */
    const wdManager = initWebDriverManager(browserName);
    if (wdManager) {
        return await wdManager.start();
    }
    return undefined;
}

function initWebDriverManager(browserName) {
    if (browserName === 'chrome') {
        return new ChromeWebDriverManager();
    }
}
