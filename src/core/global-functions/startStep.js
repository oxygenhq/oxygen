export function startStep(name, type = 'custom', opts = {}) {
    const step = this.startStep(name, type);
    step.action = opts.action || false;
    step.meta = opts.meta || {};

    return step;
}