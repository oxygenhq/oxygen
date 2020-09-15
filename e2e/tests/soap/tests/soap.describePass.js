var txt = soap.describe('http://webservices.daehosting.com/services/isbnservice.wso?WSDL');
log.info(txt);

const xtxCorrect =
    txt &&
    typeof txt === 'string' &&
    txt.length > 0 &&
    txt.includes('ISBNService') &&
    txt.includes('ISBNServiceSoap12') &&
    txt.includes('IsValidISBN10');

assert.equal(xtxCorrect, true);
