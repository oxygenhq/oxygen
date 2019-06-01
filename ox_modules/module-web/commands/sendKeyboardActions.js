/**
 * 
 * http://usejsdoc.org/
 */

/**
 * @summary Send a sequence of key board strokes to the active window or element.
 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
 *              for the list of supported raw keyboard key codes.
 * @function sendKeyboardActions with any value from keyboard 
 * @param {String} value - Sequence of key strokes to send.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.google.com");// Opens a website.
 * web.type(id='tsf',"Paris");//Write a word in search line 
 * web.sendKeyboardActions(‘Enter’);//Click on Types keys (Enter) with value from keyboard.
*/
module.exports = function(value) {
    var index=null;
    switch(value){
        case 'PageUp':
            index='\uE054';
            break;
        case 'PageDown':
            index='\uE055';
            break;
        case 'End':
            index='\uE056';
            break;
        case 'Home':
            index='\uE057';
            break;
        case 'ArrowLeft':
            index='\uE058';
            break;
        case 'ArrowUp':
            index='\uE059';
            break;
        case 'ArrowRight':
            index='\uE05A';
            break;
        case 'ArrowDown':
            index='\uE05B';
            break;
        case 'Insert':
            index='\uE05C';
            break;
        case 'Delete':
            index='\uE05D';
            break;
        case 'Enter':
            index='\uE007';
            break;
    }
    this.helpers.assertArgument(index);
    this.driver.keys(index);
};