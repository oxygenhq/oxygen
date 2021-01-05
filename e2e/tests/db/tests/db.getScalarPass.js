const conStr = require('../assets/caps');
db.setConnectionString(conStr);

var scalar = db.getScalar('select c from a_table where a = "foo"');
log.info(scalar)

assert.equal(scalar === 1, true);