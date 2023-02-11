declare namespace Oxygen {
    /**
     * @name shell
     * @description Provides methods for working with operating system shell.
     */
    interface ModuleShell {
        get name(): string;
        /**
         * @summary Execute command
         * @description Spawn child process
         * @function exec
         * @param {String} command - Shell command to be executed, including arguments, if applicable.
         * @return {String} null | Error | stdout result
         */
        exec(command: string, options?: {}): string;

        /**
         * @summary Assert whether the shell command output (stdout) is matching the specified pattern.
         * @function assertOutput
         * @param {String} pattern - Pattern to assert.
         */
        assertOutput(pattern: string): boolean;
    }
}
