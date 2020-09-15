const conStr = require('../assets/caps');
db.setConnectionString(conStr);

var allRows = db.executeQuery('select * from a_table');
log.info(allRows.length);
assert.equal(allRows && Array.isArray(allRows) && allRows.length === 2, true);