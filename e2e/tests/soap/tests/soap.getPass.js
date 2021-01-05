var ret = soap.get('http://webservices.daehosting.com/services/isbnservice.wso?WSDL', 'IsValidISBN13', { sISBN: '9789059650886'});

log.info(ret);

const retCorrect = ret && ret.IsValidISBN13Result ;

assert.equal(retCorrect, true);