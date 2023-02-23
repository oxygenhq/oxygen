declare namespace Oxygen {
    /**
     * @name pdf
     * @description Provides generic methods for working with PDF files.
     */
    interface ModulePdf {
        
        /**
         * @summary Asserts that text is present in a PDF file
         * @function assert
         * @param {String} pdfFilePath - Relative or absolute path to the PDF file.
         * @param {String} text - Text to assert.
         * @param {Number=} pageNum - Page number.
         * @param {String=} message - Message to throw if assertion fails.
         * @param {Boolean=} reverse - Check also reverse variant of string.
         */
        assert(pdfFilePath: string, text: string, pageNum?: number, message?: string, reverse?: boolean): void;

        /**
         * @summary Asserts that text is not present in a PDF file
         * @function assertNot
         * @param {String} pdfFilePath - Relative or absolute path to the pdf file.
         * @param {String} text - Text to assert.
         * @param {Number=} pageNum - Page number.
         * @param {String=} message - Message to throw if assertion fails.
         * @param {Boolean=} reverse - Check also reverse variant of string.
         */
        assertNot(pdfFilePath: string, text: string, pageNum?: number, message: string, reverse?: boolean): void;

        /**
         * @summary Count the number of times specified text is present in a PDF file.
         * @function count
         * @param {String} pdfFilePath - Relative or absolute path to the pdf file.
         * @param {String} text - Text to count.
         * @param {Number=} pageNum - Page number.
         * @param {Boolean=} reverse - Check also reverse variant of string.
         * @return {Number} Number of times the specified text was found.
         */
        count(pdfFilePath: string, text: string, pageNum?: number, reverse?: boolean): void;
    }
}