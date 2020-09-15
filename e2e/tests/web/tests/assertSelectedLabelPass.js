web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const element = web.findElement("id=searchLanguage");
const opts = element.$$('//option');
let selectedText;

for (var opt of opts) {
    if (opt.isSelected()) {
        selectedText = web.getText(opt);
    }
}

if(selectedText){
    web.assertSelectedLabel("id=searchLanguage", selectedText, 600, false);
} else {
    assert.equal(1,2, 'Script broken');
}