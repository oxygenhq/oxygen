/// <reference types="@types/node" />
declare namespace Oxygen {
    interface ModuleUtils {
        /**
         * @summary Pause test execution for the given amount of milliseconds.
         * @function pause
         * @param {Number} ms - Milliseconds to pause the execution for.
         */
        pause(ms: number): void;

        /**
         * @summary Decrypt text
         * @function decrypt
         * @param {String} text - Text
         * @return {Object} DecryptResult Object with getDecryptResult method
         * @example <caption>[javascript] Usage example</caption>
         * // to encrypt plaintext into ciphertext
         * const encrypt = utils.encrypt('https://www.wikipedia.org');
         * log.info(encrypt); // will print b757ba2c2fc50fbb511d596816ca06c4fa56f4e98ce222f30bc58d5251ed635e
         *
         * // to decrypt ciphertext and use it in script
         * const decrypt = utils.decrypt(encrypt);
         * log.info(decrypt); // will print ENCRYPTED
         *
         * web.init();
         * web.open(decrypt); // will open https://www.wikipedia.org
         *
         * // to get original plaintext use getDecryptResult
         * const value = decrypt.getDecryptResult();
         * log.info(value); //will print https://www.wikipedia.org
         */
        decrypt(text: string): any;

        /**
         * @summary Encrypt text
         * @function encrypt
         * @param {String} text - Text
         * @return {String} Encrypted text
         * @example <caption>[javascript] Usage example</caption>
         * // to encrypt plaintext into ciphertext
         * const encrypt = utils.encrypt('https://www.wikipedia.org');
         * log.info(encrypt); // will print b757ba2c2fc50fbb511d596816ca06c4fa56f4e98ce222f30bc58d5251ed635e
         *
         * // to decrypt ciphertext and use it in script
         * const decrypt = utils.decrypt(encrypt);
         * log.info(decrypt); // will print ENCRYPTED
         *
         * web.init();
         * web.open(decrypt); // will open https://www.wikipedia.org
         *
         * // to get original plaintext use getDecryptResult
         * const value = decrypt.getDecryptResult();
         * log.info(value); //will print https://www.wikipedia.org
         */
        encrypt(text: string): string;

        /**
         * @summary Reads data from csv file
         * @function readCsv
         * @param {String} filePath - Absolute path to file
         * @param {Object=} options - [Options](https://csv.js.org/parse/options/)
         */
        readCsv(filePath: string, options?: any | undefined): any;

        /**
         * @summary Writes data into csv file
         * @function writeCsv
         * @param {String} filePath - Absolute path to file
         * @param {Array} data - CSV data in format [{column_name_1: 'foo', column_name_2: 'bar'}]
         * @param {Object=} options - [Options](https://github.com/anton-bot/objects-to-csv#async-todiskfilename-options)
         */
        writeCsv(filePath: string, data: any[], options?: any | undefined): void;

        /**
         * @summary Reads data from Xlsx file
         * @function readXlsx
         * @param {String} filePath - Absolute path to file
         * @return {Array} - Array of xlsx data
         */
        readXlsx(filePath: string): any[];

        /**
         * @summary Uses the DNS protocol to resolve a host name
         * @function dnsResolve
         * @param {String} hostname - Host name to resolve.
         * @param {String=} rrType - Resource record type. Default: 'A'.
         * @return {String[] | Object} - Array or Object of resource records. The type and structure of individual results vary based on rrtype
         */
        dnsResolve(hostname: string, rrType?: string | undefined): string[] | any;

        /**
         * @summary Parse XML data to JS object
         * @function xmlToJson
         * @param {string|Buffer} xmlDataStr - Like <root a="nice" b="very nice" ><a>wow</a></root>
         * @param {boolean|Object} options - [Options](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/2.XMLparseOptions.md)
         */
        xmlToJson(xmlDataStr: string | Buffer, options?: boolean | any): any;
    }
}
