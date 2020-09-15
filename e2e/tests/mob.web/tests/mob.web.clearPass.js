const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("https://www.wikipedia.org/");
mob.type("id=searchInput", "wiki");
mob.clear("id=searchInput");
const value = mob.getValue("id=searchInput");
const equal = value === '';
assert.equal(equal, true);