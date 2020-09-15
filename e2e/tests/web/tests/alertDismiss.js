web.init();
web.setTimeout(6000);
web.open("wikipedia.org");
web.execute(function(p){ alert('p');});
web.alertDismiss();