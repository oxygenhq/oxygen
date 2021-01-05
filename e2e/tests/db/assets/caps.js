const path = require('path');
const dbPath = path.resolve(__dirname, '../assets/test.db');

module.exports = `DRIVER=SQLite3 ODBC Driver;Database=${dbPath};LongNames=0;Timeout=2000;NoTXN=0;SyncPragma=NORMAL;StepAPI=0;`;