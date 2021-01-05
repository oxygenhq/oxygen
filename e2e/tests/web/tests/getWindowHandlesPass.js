web.init();
web.setTimeout(6000);
web.open('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_link_target');
web.selectFrame('id=iframeResult');
web.click('/html/body/a');
const handles = web.getWindowHandles();
const handlesCorrect = handles && Array.isArray(handles) && handles.length > 0 && handles.length === 2;
assert.equal(handlesCorrect, true);