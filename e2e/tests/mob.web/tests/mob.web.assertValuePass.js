const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("wikipedia.org");
const element = mob.findElement("id=searchLanguage");
const opts = element.$$('//option');
let selectedValue;

for (var opt of opts) {
    if (opt.isSelected()) {
        selectedValue = opt.getValue();
    }
}

if(selectedValue){
    mob.assertValue("id=searchLanguage", selectedValue);
} else {
    assert.equal(1,2, 'Script broken');
}