const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("https://www.wikipedia.org");
mob.click("id=searchInput");
mob.type("id=searchInput", "wiki");
mob.pause(5000);
mob.hideKeyboard("pressKey", "Search");
mob.pause(5000);