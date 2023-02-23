declare namespace Oxygen {
    /**
     * @name log
     * @description Provides methods for printing user defined messages to test results.
     */
    interface ModuleLog {
        /**
         * @summary Print an INFO message.
         * @function info
         * @param {String} msg - Message to print.
         */
        info(msg: string): void;

        /**
         * @summary Print an ERROR message.
         * @function error
         * @param {String} msg - Message to print.
         */
        error(msg: string, err?: any): void;

        /**
         * @summary Print a DEBUG message.
         * @function debug
         * @param {String} msg - Message to print.
         */
        debug(msg: string): void;

        /**
         * @summary Print a WARN message.
         * @function warn
         * @param {String} msg - Message to print.
         */
        warn(msg: string): void;
    }
}