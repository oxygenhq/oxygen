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

declare namespace Oxygen {
    type OxygenModuleType = ModuleWeb 
        | ModuleMob 
        | ModuleWin 
        | ModuleHttp 
        | ModuleLog 
        | ModuleUtils 
        | ModuleShell
        | ModuleProxy
        | ModuleApplitools
        | ModulePdf;

    interface OxygenContext {
        params: { [key: string]: string };
        vars: { [key: string]: any };
        env: { [key: string]: string };
        caps: { [key: string]: any };
    }

    interface OxGlobal {
        /**
         * Gets Oxygen execution context.
         */
        ctx: OxygenContext;
        /**
         * Gets test execution options.
         */
        options: any;
        /**
         * Gets default test capabilities.
         */
        caps: { [key: string]: any };
        /**
         * Access various Oxygen modules.
         */
        modules: { [key: string]: OxygenModuleType };
        /**
         * Add test attribute name and value to the test results (similar to tags).
         */
        addAttribute(name: string, value: any): void;
    }
}
