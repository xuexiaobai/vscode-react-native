import Q = require("q");

export class Promises {
    public retryAsync<T>(func: () => Q.Promise<T>, condition: (result: T) => boolean, maxRetries: number, iteration: number, delay: number,
                         failure: string): Q.Promise<T> {
        return func().then(result => {
            if (condition(result)) {
                return result;
            } else {
                if (iteration < maxRetries) {
                    return Q.delay(delay).then(() => this.retryAsync(func, condition, maxRetries, iteration + 1, delay, failure));
                } else {
                    throw new Error(failure);
                }
            }
        });
    }
}
