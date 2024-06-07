/**
 * Returns a list of authentication methods
 * @param response param
 * @return an array of lower-case authentication methods
 */
export function getAuthenticateMethods(response) {
    return response?.headers?.['www-authenticate']?.split(',').map((i) => i.trim().toLowerCase());
}

/**
 * Returns the basic auth header
 * @param user the username
 * @param pwd the password
 * @return the basic auth header
 */
export function createBasicMessage(user, pwd) {
    return 'Basic ' + Buffer.from(user + ':' + pwd, 'utf8').toString('base64');
}