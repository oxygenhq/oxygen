const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open('wikipedia.org');
mob.waitForVisible('#www-wikipedia-org > div.central-textlogo > h1 > strong');