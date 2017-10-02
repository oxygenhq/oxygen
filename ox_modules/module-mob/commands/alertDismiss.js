/**
 * @summary Dismisses currently displayed alert.
 * @function alertDismiss
 * @for android, ios, hybrid, web
*/
module.exports = function() {
    return this.driver.alertDismiss();
};
