// Project: https://www.oxygenhq.org
// GitHub:  https://github.com/cypress-io/cypress
// TypeScript Version: 3.4

/// <reference path="./oxygen.d.ts" />
/// <reference path="./module-web.d.ts" />
/// <reference path="./module-mob.d.ts" />
/// <reference path="./module-win.d.ts" />
/// <reference path="./module-http.d.ts" />
/// <reference path="./module-log.d.ts" />
/// <reference path="./module-utils.d.ts" />
/// <reference path="./module-shell.d.ts" />
/// <reference path="./module-proxy.d.ts" />
/// <reference path="./module-eyes.d.ts" />
/// <reference path="./module-pdf.d.ts" />
export {};

declare global {
    /**
     * Provides methods for browser automation.
     */
    var web: Oxygen.ModuleWeb;
    /**
     * Provides methods for mobile automation.
     */
    var mob: Oxygen.ModuleMob;
    /**
     * Provides methods for Microsoft Windows automation.
     */
    var win: Oxygen.ModuleWin;
    /**
     * Provides methods for printing user defined messages to test results.
     */
    var log: Oxygen.ModuleLog;
    /**
     * Provides miscellaneous utility methods.
     */
    var utils: Oxygen.ModuleUtils;
    /**
     * Provides methods for working with operating system shell.
     */
    var shell: Oxygen.ModuleShell;
    /**
     * Provides methods for intercepting network traffic via mitmproxy.
     */
    var proxy: Oxygen.ModuleProxy;
    /**
     * Provides methods to use Applitools Eyes visual testing solution.
     */
    var eyes: Oxygen.ModuleApplitools;
    /**
     * Provides generic methods for working with PDF files.
     */
    var pdf: Oxygen.ModulePdf;
    /**
     * Oxygen execution context global object.
     */
    var ox: Oxygen.OxGlobal;
}