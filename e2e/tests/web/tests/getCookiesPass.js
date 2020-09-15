web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
const cookies = web.getCookies();

const goodCookies = cookies && Array.isArray(cookies) && cookies.length > 0;
assert.equal(goodCookies, true);

cookies.map(({name}) => web.deleteCookies(name));

const cookiesAfterDelete = web.getCookies();
const goodDeletedCookies = cookiesAfterDelete && Array.isArray(cookiesAfterDelete) && cookiesAfterDelete.length === 0;
assert.equal(goodDeletedCookies, true);