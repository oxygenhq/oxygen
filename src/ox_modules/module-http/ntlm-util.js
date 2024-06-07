/**
 * Returns a list of authentication methods
 * @param response param
 * @return an array of lower-case authentication methods
 */
export function getAuthenticateMethods(response) {
    return response?.headers?.['www-authenticate']?.split(',').map((i) => i.trim().toLowerCase());
}