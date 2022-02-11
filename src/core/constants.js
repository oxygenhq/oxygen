const webCommands = [
    'alertAccept',
    'alertDismiss',
    'back',
    'clear',
    'click',
    'clickHidden',
    'closeWindow',
    'deleteCookies',
    'deselect',
    'doubleClick',
    'dragAndDrop',
    'execute',
    'fileBrowse',
    'isVisible',
    'makeVisible',
    'newWindow',
    'open',
    'point',
    'pointJS',
    'refresh',
    'rightClick',
    'rightClickActions',
    'scrollToElement',
    'select',
    'selectFrame',
    'selectWindow',
    'sendKeys',
    'setWindowSize',
    'type'
];

export const commandsWhichShouldBeExcludedTakeScreenshot = [
    ...webCommands
];