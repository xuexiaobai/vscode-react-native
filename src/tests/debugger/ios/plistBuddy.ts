// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as mockery from "mockery";

import * as Q from "q";

const FILE_UNDER_TEST = "../../../debugger/ios/plistBuddy";
import * as PlistBuddyType from "../../../debugger/ios/plistBuddy"; // Just for typings

describe("PListBuddy", function() {
    beforeEach(function() {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: true
        });

        mockery.registerAllowables([
            "q",
            "path",
            FILE_UNDER_TEST
        ]);
    });

    afterEach(function() {
        mockery.deregisterAll();
        mockery.disable();
    });

    it("should attempt to set plist properties correctly", function() {
        const plistFileName = "testFile.plist";
        const plistProperty = "myProperty";
        const plistValue = "myValue";

        const deferred = Q.defer<void>();

        const ChildProcessClass = function() { };
        ChildProcessClass.prototype.exec = function(command: string, opts: any) {
            // Fail the set commnad, causing it to retry with Add
            if (command.match(/Set/)) {
                return { outcome: Q.reject(new Error("Setting does not exist")) };
            } else if (command.match(/Add/)) {
                deferred.resolve(void 0);
                return { outcome: Q.resolve("stdout") };
            } else {
                deferred.reject(new Error("Unexpected Command " + command));
                return { outcome: Q.reject(new Error("Unexpected command")) };
            }
        };

        mockery.registerMock("../../utils/node/node", {
            Node: {
                ChildProcess: ChildProcessClass
            }
        });
        mockery.registerMock("./xcodeproj", {});

        const TestPlistBuddy: typeof PlistBuddyType = require(FILE_UNDER_TEST);
        const testPlistBuddy = new TestPlistBuddy.PlistBuddy();

        return Q.all([
            testPlistBuddy.setPlistProperty(plistFileName, plistProperty, plistValue),
            deferred.promise]);
    });

    it("should read the bundleID correctly", function() {
        const projectRoot = "ProjectRoot";
        const testBundleId = "TestBundleId";

        const XcodeprojTestClass = function() { };
        XcodeprojTestClass.prototype.findXcodeprojFile = function(root: string) {
            if (root !== projectRoot) {
                return Q.reject(new Error("Not given correct project root"));
            }
            return Q.resolve("TestProject.xcodeproj");
        };
        mockery.registerMock("./xcodeproj", {
            Xcodeproj: XcodeprojTestClass
        });

        const ChildProcessClass = function() { };
        ChildProcessClass.prototype.exec = function(command: string, opts: any) {
            if (command.indexOf("Print:CFBundleIdentifier") < 0) {
                return { outcome: Q.reject(new Error("Incorrect PlistBuddy command: " + command)) };
            }

            // exec typically returns strings with newlines lurking around
            // but our PlistBuddy class is supposed to strip them off
            // so the results are ready to be consumed immediately
            return { outcome: Q.resolve(`${testBundleId}\n`) };
        };

        mockery.registerMock("../../utils/node/node", {
            Node: {
                ChildProcess: ChildProcessClass
            }
        });

        const TestPlistBuddy: typeof PlistBuddyType = require(FILE_UNDER_TEST);
        const testPlistBuddy = new TestPlistBuddy.PlistBuddy();

        return testPlistBuddy.getBundleId(projectRoot).then((bundleId: string) => {
            if (testBundleId !== bundleId) {
                throw new Error("Incorrect bundleId returned");
            }
        });
    });
});