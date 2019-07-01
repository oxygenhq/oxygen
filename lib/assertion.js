var oxutil = require('./util');
var pdfreader = require('pdfreader');
var rows = {}; // indexed by y-position

// parse command line arguments
var argv = require('minimist')(process.argv.slice(2));

var srcFilePath = argv._[0];
var searchStr = argv._[1];
var expectValue = argv._[2];

if(!searchStr){
    console.log('No search value parameter');
    process.exit(1);
}

if(!expectValue){
    console.log('No expect value parameter');
    process.exit(1);
}

searchStr = searchStr.split(" ").join("");
expectValue = expectValue.split(" ").join("");

var selectNext = false;
var findedValue;

function printRows() {
    
    Object.keys(rows) // => array of y-positions (type: float)
        .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
        .some(y => {
            // console.log('y '+ y);
            // console.log('rows[y]', rows[y]);
            var line = (rows[y] || []).join("");
            var inludes = line.includes(searchStr);
            
            if(selectNext){
                findedValue = line;
                selectNext = false;
            }

            if(inludes){
                selectNext = true;
            }
        });
}


if(srcFilePath){
    srcFilePath = oxutil.resolvePath(srcFilePath, process.cwd());
    
    // console.log('srcFilePath', srcFilePath);

    if(srcFilePath){

        new pdfreader.PdfReader().parseFileItems(srcFilePath, function(
            err,
            item
        ) {
            if(err){
                console.log('err', err);
            }

            if (item && item.page) {
                // end of file, or page
                printRows();

                var result = findedValue === expectValue;
              

                if(item && item.page){
                    console.log('---');
                    console.log("PAGE:", item.page);
                }

                console.log('findedValue: ', findedValue || 'not finded');
                console.log('expectValue: ', expectValue);
                console.log('findedValue === expectValue: ', result);
                console.log('---');

                if(result){
                    console.log('finded');
                    process.exit(0);
                }
                
                rows = {}; // clear rows for next page
            } else if (item && item.text) {
                // accumulate text items into rows object, per line
                (rows[item.y] = rows[item.y] || []).push(item.text);
            } else {
                if(typeof item === 'undefined'){
                    console.log('not finded');
                    process.exit(1);
                }
            }
        })
    }

} else {
    console.log('no file as first parameter');
}
