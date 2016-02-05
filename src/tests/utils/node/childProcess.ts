// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.


import * as mockery from "mockery";

const FILE_UNDER_TEST = "../../../utils/node/childProcess";
import * as TestChildProcessType from "../../../utils/node/childProcess"; // Just for typings

describe("ChildProcess", function () {
    beforeEach(function () {
       mockery.enable({
           useCleanCache: true,
           warnOnUnregistered: true
       });
       // Permit Q and the specific module that we are loading to use real requires
       mockery.registerAllowable("q");
       mockery.registerAllowable(FILE_UNDER_TEST);
    });

    afterEach(function () {
       mockery.deregisterAll();
       mockery.disable();
    });

    it("should invoke exec correctly", function (): Q.Promise<any> {
        const testExecOptions = {};
        const testExecCommand = "testcommand";

        // Mock out child_process with a single-method version purely for testing exec
        mockery.registerMock("child_process", {
            exec: function (command: string, options: any, cb: (err: Error, stdout: string, stderr: string) => void) {
                if (command === testExecCommand && options === testExecOptions) {
                    cb(null, "stdout", "stderr");
                } else {
                    cb(new Error("Incorrect options passed"), null, null);
                }
            }
        });

        const TestChildProcess: typeof TestChildProcessType = require(FILE_UNDER_TEST);
        const testChildProcess = new TestChildProcess.ChildProcess();

        const execResult = testChildProcess.exec(testExecCommand, testExecOptions);

        return execResult.outcome;
    });

    it("should report failures correctly", function (): Q.Promise<any> {
        const testExecOptions = {};
        const testExecCommand = "testcommand";

        mockery.registerMock("child_process", {
            exec: function (command: string, options: any, cb: (err: Error, stdout: string, stderr: string) => void) {
                if (command === testExecCommand && options === testExecOptions) {
                    cb(new Error("CommandFailed"), null, null);
                } else {
                    cb(new Error("Incorrect options passed"), null, null);
                }
            }
        });

        const TestChildProcess: typeof TestChildProcessType = require(FILE_UNDER_TEST);
        const testChildProcess = new TestChildProcess.ChildProcess();

        const execResult = testChildProcess.exec(testExecCommand, testExecOptions);

        return execResult.outcome.then(() => {
            throw new Error("Should have rejected the promise.");
        }, (err: {error: Error, stderr: string}) => {
            if (err.error.message === "CommandFailed") {
                return;
            } else {
                throw err;
            }
        });
    });
});