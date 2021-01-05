const conStr = require('../assets/caps');
db.setConnectionString(conStr);

// add new data to the table
db.executeNonQuery('insert into a_table (a, b ,c) values ("aaaa", "bbbb", 1)');

// verify that it was added
let scalar = db.getScalar('select b from a_table where a = "aaaa"');
log.info(scalar)
assert.equal(scalar === 'bbbb', true);

// cleanup
db.executeNonQuery('delete from a_table where a = "aaaa"');

// verify cleanup
const allRows = db.executeQuery('select * from a_table');
log.info(allRows);
log.info(allRows.length);
assert.equal(allRows && Array.isArray(allRows) && allRows.length === 2, true);