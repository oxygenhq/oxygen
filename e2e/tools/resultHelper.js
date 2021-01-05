const expect = require('chai').expect;
const passedRegex = /Test \d|\w has finished with status: PASSED/g;
const failedRegex = /Test \d|\w has finished with status: FAILED/g;

const passedTest = (text) => {
    let result = false;

    const matchResult = text.match(passedRegex);

    if (matchResult) {
        result = matchResult.join().endsWith('has finished with status: PASSED');
    }

    return result;
};

const failedTest = (text) => {
    let result = false;

    const matchResult = text.match(failedRegex);

    if (matchResult) {
        result = matchResult.join().endsWith('has finished with status: FAILED');
    }

    return result;
};

const shouldPass = (response) => {
    const passed = passedTest(response);
    const failed = failedTest(response);

    if (!passed) {
        console.log(response);
    } else if (failed) {
        console.log(response);
    }

    expect(passed).to.equal(true);
    expect(failed).to.equal(false);
};

const shouldFail = (response) => {
    const passed = passedTest(response);
    const failed = failedTest(response);

    if (passed) {
        console.log(response);
    } else if (!failed) {
        console.log(response);
    }

    expect(passed).to.equal(false);
    expect(failed).to.equal(true);
};

module.exports = {
    passedTest,
    failedTest,
    shouldPass,
    shouldFail
};