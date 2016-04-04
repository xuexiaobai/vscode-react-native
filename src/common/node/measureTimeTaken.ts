// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as assert from "assert";

import * as Q from "q";

import {PromiseUtil} from "./promise";

export class TimeTakenMeasurer {
    private initialHRTime: number[] = null;

    constructor() {
        this.initialHRTime = process.hrtime();
    }

    public measureSeconds(): number {
        return this.measureMilliseconds() / 1000;
    }

    public measureMilliseconds(): number {
        const ellapsedHRTime = process.hrtime(this.initialHRTime);
        const elappsedMilliseconds = ellapsedHRTime[0] * 1000 + ellapsedHRTime[1] / 1000000;
        return elappsedMilliseconds;
    }
}

const timingsFileName = "timings.txt";
const timingsFilePath = path.join(os.tmpdir(), timingsFileName);

function getClassName(object: Object): string {
    return /function (.{1,})\(/.exec(object.constructor.toString())[1];
}

function printObject(object: Object): string {
    try {
        return JSON.stringify(object);
    } catch (exception) {
        try {
            return "" + object;
        } catch (exception) {
            return "Couldn't print object";
        }
    }
}

function measureTimeAfterPromise(name: string,
    timeTakenMeasurer: TimeTakenMeasurer,
    args: any[],
    resultOrResultPromise: Q.Promise<any> | any): Q.Promise<any> | any {
    return new PromiseUtil().executeAfter(resultOrResultPromise, result => {
        const secondsTaken = timeTakenMeasurer.measureSeconds();
        console.log(`FINISHING - ${name}`);
        const logEntry = `${name}(${printObject(args)}) took ${secondsTaken} secs.\n`;
        fs.appendFile(timingsFilePath, logEntry);
        return result;
    });
}

function executeMeasuringTimeTaken<T>(name: string, receiver: Object, method: Function, args: any[], promiseName?: string) {
    // Prepare to time function
    const timeTakenMeasurer = new TimeTakenMeasurer();
    console.log(`STARTING - ${name}`);

    // Execute the function
    const resultOrResultPromise = method.apply(receiver, args);

    // Save the results
    if (promiseName) {
        const promise = <Q.Promise<any>>resultOrResultPromise[promiseName];
        assert(Q.isPromise(promise), `Member ${promiseName} result of ${name} should be a promise`);
        resultOrResultPromise[promiseName] = measureTimeAfterPromise(name, timeTakenMeasurer, args, promise);
        return resultOrResultPromise;
    } else {
        return measureTimeAfterPromise(name, timeTakenMeasurer, args, resultOrResultPromise);
    }
}

export function measure(promiseName?: string) {
    return function(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Function>): PropertyDescriptor {
        const originalFunction = descriptor.value;

        descriptor.value = function() {
            const args = Array.prototype.slice.call(arguments);
            const methodFullName = `${getClassName(target)}.${propertyKey}`;
            return executeMeasuringTimeTaken(methodFullName, this, originalFunction, args, promiseName);
        };

        return descriptor;
    };
}