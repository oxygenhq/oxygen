const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open('https://javascript.info/alert-prompt-confirm');
mob.clickLong('body > div.page-wrapper.page-wrapper_sidebar_on > div.page.page_sidebar_on.page_inner_padding.page_sidebar-animation-on > div.page__inner > main > div.content > div > div > div > div.task__content > p:nth-child(2) > a', 1000);
mob.pause(2000);