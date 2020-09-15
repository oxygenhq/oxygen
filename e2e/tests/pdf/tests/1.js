const path = require('path');
const pdfPath = path.resolve(__dirname, '../assets/test.pdf');

pdf.assert(pdfPath, 'Dictumst quisque sagittis purus sit', 1, "Text not found in PDF");