const selector = '#www-wikipedia-org > div.central-textlogo > h1 > span';

web.init();
web.setTimeout(6000);
web.open("wikipedia.org");

web.waitForVisible(selector);

const element = web.findElement(selector);
const selectedText = web.getText(selector);

if(selectedText){
    web.assertText(selector, selectedText, 600, false);
} else {
    assert.equal(1,2, 'Script broken');
}