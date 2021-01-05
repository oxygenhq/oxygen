const path = require("path");
web.init();
web.setTimeout(6000);
web.open("https://www.w3schools.com/tags/tryit.asp?filename=tryhtml5_input_type_file");
web.selectFrame('id=iframeResult');
const fileName = 'assets/image.jpg';
const filePath = path.resolve(__dirname, '..' , fileName);
web.fileBrowse("id=myfile", filePath);