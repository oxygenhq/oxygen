web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const element = web.findElement("id=searchLanguage");
const opts = element.$$('//option');
let selectedValue;

for (var opt of opts) {
    if (opt.isSelected()) {
        selectedValue = opt.getValue();
    }
}

if(selectedValue){
    web.assertSelectedValue("id=searchLanguage", selectedValue, 600, false);
} else {
    assert.equal(1,2, 'Script broken');
}