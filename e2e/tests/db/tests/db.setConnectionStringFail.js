const path = require('path');
const dbPath = path.resolve(__dirname, '../assets/NOT_VALID_NAME.db');

const conStr = `DRIVER=SQLite3 ODBC Driver;Database=${dbPath};LongNames=0;Timeout=2000;NoTXN=0;SyncPragma=NORMAL;StepAPI=0;`;
db.setConnectionString(conStr);

var allRows = db.executeQuery('select * from a_table');
log.info(allRows);
log.info(allRows.length);
assert.equal(allRows && Array.isArray(allRows) && allRows.length === 2, true);