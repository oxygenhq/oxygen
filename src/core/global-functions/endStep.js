export function endStep(step = null, status = STATUS.PASSED, opts = {}) {
    if (!step) {
        return this.endStep(status);
    }
    else if (typeof step === 'string') {
        if (this._stepsStack && this._stepsStack.length > 0) {
            const currentStep = this._stepsStack[this._stepsStack.length - 1];
            if (currentStep.name !== step) {
                throw new Error (`Cannot end step "${step}" because it's not current.`);
            }
        }
        return this.endStep(status);
    }
    throw new Error('"step" argument must be either string or null');
}