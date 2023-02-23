declare namespace Oxygen {
    interface ModuleApplitools {
        /**
         * @summary Initializes Applitools Eyes session.
         * @function init
         * @param {string|object} module - A module name or a reference to the mododule to be associated with Eyes current session.
         * @param {apiKey} [apiKey] - An optional Applitools API Key.
         * If this parameter is not provided, API Key must be specified in the test configuration file.
         */
        init(module: string | object, apiKey?: any): void;

        /**
         * @summary Closes Applitools Eyes session, terminates the sequence of checkpoints, and then waits for and returns the test results.
         * @function dispose
         * @return {TestResult} Eyes test result.
         */
        dispose(): any;

        /**
         * @summary Preform visual validation for a certain target.
         * @function check
         * @param {string} name - A name to be associated with the match.
         * @param {Target} [target] - An optional target instance which describes whether we want a window/region/frame.
         * @return {boolean} A promise which is resolved when the validation is finished.
         */
        check(name: string, target?: any): boolean;

        /**
         * @summary Takes a snapshot of the application under test and matches it with
         * the expected output.
         * @function checkWindow
         * @param {string} [name=] - An optional tag to be associated with the snapshot.
         * @param {number} [matchTimeout=-1] - The amount of time to retry matching (Milliseconds).
         * @return {boolean} A promise which is resolved when the validation is finished.
         */
        checkWindow(name?: string, matchTimeout?: number): boolean;

    }
}
