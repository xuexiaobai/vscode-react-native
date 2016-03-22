// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as Q from "q";
import * as path from "path";
import * as mockFs from "mock-fs";

import {AndroidPlatform} from "../../../debugger/android/androidPlatform";
import {IRunOptions} from "../../../common/launchArgs";
import {FileSystem} from "../../../common/node/fileSystem";
import {ReactNative022} from "../../../test/resources/reactNative022";
import {SimulatedDeviceHelper} from "../../../test/resources/simulatedDeviceHelper";
import {SimulatedAVDManager} from "../../../test/resources/simulatedAVDManager";
import {FakeExtensionMessageSender} from "../../../test/resources/fakeExtensionMessageSender";
import {ExtensionMessage} from "../../../common/extensionMessaging";

import "should";

// TODO: Launch the extension server and test the logcat functionality

interface TestUsingRecording {
    (expectation: string, recordingNames: string[], assertion?: () => void): Mocha.ITest;
    (expectation: string, recordingNames: string[], assertion?: (done: MochaDone) => void): Mocha.ITest;
    only(expectation: string, recordingNames: string[], assertion?: () => void): Mocha.ITest;
    only(expectation: string, recordingNames: string[], assertion?: (done: MochaDone) => void): Mocha.ITest;
    skip(expectation: string, recordingNames: string[], assertion?: () => void): void;
    skip(expectation: string, recordingNames: string[], assertion?: (done: MochaDone) => void): void;
}

suite("androidPlatform", function() {
    this.timeout(60 * 1000); // TODO: DIEGO REMOVE THIS
    suite("debuggerContext", function() {
        const projectRoot = "C:/projects/SampleApplication_21/";
        const androidProjectPath = path.join(projectRoot, "android");
        const applicationName = "SampleApplication";
        const androidPackageName = "com.sampleapplication";
        const genericRunOptions: IRunOptions = { projectRoot: projectRoot };

        let fileSystem: FileSystem;
        let deviceHelper: SimulatedDeviceHelper;
        let simulatedAVDManager: SimulatedAVDManager;
        let reactNative: ReactNative022;
        let fakeExtensionMessageSender: FakeExtensionMessageSender;
        let androidPlatform: AndroidPlatform;

        setup(() => {
            // Configure all the dependencies we'll use in our tests
            fileSystem = new FileSystem({fs: mockFs.fs({})});
            deviceHelper = new SimulatedDeviceHelper(fileSystem);
            simulatedAVDManager = new SimulatedAVDManager(deviceHelper);
            reactNative = new ReactNative022(deviceHelper, fileSystem);
            fakeExtensionMessageSender = new FakeExtensionMessageSender();
            androidPlatform = new AndroidPlatform({ deviceHelper: deviceHelper, reactNative: reactNative,
                fileSystem: fileSystem, extensionMessageSender: fakeExtensionMessageSender });

            // Create a React-Native project we'll use in our tests
            return reactNative.createProject(projectRoot, applicationName);
        });

        const testWithRecordings: TestUsingRecording = <TestUsingRecording>((testName: string, recordingNames: string[], code: () => Q.Promise<void>): void => {
            recordingNames.forEach(recordingName => {
                test(`${testName} using recording ${recordingName}`, () => {
                    return reactNative.loadRecordingFromName(recordingName).then(code);
                });
            });
        });

        testWithRecordings.skip = (expectation: string, recordingNames: string[], assertion?: (done: MochaDone) => void) => {
            test.skip(expectation, assertion);
        };

        function shouldHaveReceivedSingleLogCatMessage(deviceId: string): void {
            const expectedMessage = { message: ExtensionMessage.START_MONITORING_LOGCAT, args: [ deviceId ]};

            const messagesSent = fakeExtensionMessageSender.getAllMessagesSent();
            const messagesWithoutUndefineds = messagesSent.map(message => { return { message: message.message,
                args: message.args.filter(value => value) }; });
            messagesWithoutUndefineds.should.eql([expectedMessage]);
        }

        function shouldHaveReceivedNoLogCatMessages(): void {
            fakeExtensionMessageSender.getAllMessagesSent().should.eql([]);
        }

        testWithRecordings("runApp launches the app when a single emulator is connected",
                           ["react-native/run-android/win10-rn0.22/succedsWithOneVSEmulator"], () => {
            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunch("Nexus_5");
                }).then(() => {
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                    return deviceHelper.isAppRunning(androidPackageName);
                }).then(isRunning => {
                    isRunning.should.be.true();
                    shouldHaveReceivedSingleLogCatMessage("Nexus_5");
                });
        });

        testWithRecordings("runApp launches the app when two emulators are connected",
                           ["react-native/run-android/win10-rn0.22/succedsWithTwoVSEmulators"], () => {
            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunchAll("Nexus_5", "Nexus_6");
                }).then(() => {
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                    return Q.all([deviceHelper.isAppRunning(androidPackageName, "Nexus_5"),
                        deviceHelper.isAppRunning(androidPackageName, "Nexus_6")]);
                }).spread((isRunningOnNexus5, isRunningOnNexus6) => {
                    // It should be running in exactly one of these two devices
                    isRunningOnNexus5.should.not.eql(isRunningOnNexus6);
                    const emulatorWithAppRunningId = isRunningOnNexus5 ? "Nexus_5" : "Nexus_6";
                    shouldHaveReceivedSingleLogCatMessage(emulatorWithAppRunningId);
                });
        });

        testWithRecordings("runApp launches the app when three emulators are connected",
                           ["react-native/run-android/win10-rn0.22/succedsWithThreeVSEmulators"], () => {
            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunchAll("Nexus_5", "Nexus_6", "Other_Nexus_6");
                }).then(() => {
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                    return Q.all([deviceHelper.isAppRunning(androidPackageName, "Nexus_5"),
                        deviceHelper.isAppRunning(androidPackageName, "Nexus_6"),
                        deviceHelper.isAppRunning(androidPackageName, "Other_Nexus_6")]);
                }).then(isRunningList => {
                    // It should be running in exactly one of these two devices
                    isRunningList.filter(v => v).should.eql([true]);

                    // Get index of running emulator
                    const index = isRunningList.indexOf(true);
                    const emulatorWithAppRunningId = ["Nexus_5", "Nexus_6", "Other_Nexus_6"][index];
                    shouldHaveReceivedSingleLogCatMessage(emulatorWithAppRunningId);
                });
        });

        testWithRecordings("runApp fails if no devices are connected",
                           ["react-native/run-android/win10-rn0.22/failsDueToNoDevicesConnected"], () => {
            return Q({})
                .then(() => {
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                   should.assert(false, "runApp should've exited with an error");
                }, reason => {
                   reason.message.should.eql("Unknown error");
                   shouldHaveReceivedNoLogCatMessages();
                });
        });

        testWithRecordings("runApp launches the app in an online emulator only",
                           ["react-native/run-android/win10-rn0.22/succedsWithFiveVSEmulators"], () => {
            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunchAll("Nexus_5", "Nexus_6", "Nexus_10", "Nexus_11", "Nexus_12");
                }).then(() => {
                    return deviceHelper.notifyDevicesAreOffline("Nexus_5", "Nexus_6", "Nexus_10", "Nexus_12");
                }).then(() => {
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                    return deviceHelper.isAppRunning(androidPackageName, "Nexus_11");
                }).then((isRunningOnNexus11) => {
                    isRunningOnNexus11.should.be.true();
                    shouldHaveReceivedSingleLogCatMessage("Nexus_11");
                });
        });

        testWithRecordings("runApp launches the app in the device specified as target",
                           ["react-native/run-android/win10-rn0.22/succedsWithFiveVSEmulators"], () => {
            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunchAll("Nexus_5", "Nexus_6", "Nexus_10", "Nexus_11", "Nexus_12");
                }).then(() => {
                    const runOptions: IRunOptions = { projectRoot: projectRoot, target: "Nexus_12"};
                    return androidPlatform.runApp(runOptions);
                }).then(() => {
                    return deviceHelper.isAppRunning(androidPackageName, "Nexus_12");
                }).then((isRunningOnNexus12) => {
                    isRunningOnNexus12.should.be.true();
                    shouldHaveReceivedSingleLogCatMessage("Nexus_12");
                });
        });

        testWithRecordings("runApp launches the app in a random online device if the target is offline",
                           ["react-native/run-android/win10-rn0.22/succedsWithTenVSEmulators"], () => {
            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunchAll("Nexus_5", "Nexus_6", "Nexus_10", "Nexus_11", "Nexus_12",
                        "Nexus_13", "Nexus_14", "Nexus_15", "Nexus_16", "Nexus_17");
                }).then(() => {
                    return deviceHelper.notifyDevicesAreOffline("Nexus_5", "Nexus_6", "Nexus_10", "Nexus_12");
                }).then(() => {
                    const runOptions: IRunOptions = { projectRoot: projectRoot, target: "Nexus_12"};
                    return androidPlatform.runApp(runOptions);
                }).then(() => {
                    return deviceHelper.findDevicesRunningApp(androidPackageName);
                }).then((devicesRunningAppId) => {
                    const onlineDevices = ["Nexus_11", "Nexus_13", "Nexus_14", "Nexus_15", "Nexus_16", "Nexus_17"];

                    devicesRunningAppId.length.should.eql(1);
                    onlineDevices.should.containEql(devicesRunningAppId[0]);
                    shouldHaveReceivedSingleLogCatMessage(devicesRunningAppId[0]);
                });
        });

        testWithRecordings("runApp doesn't fail even if the call to start the LogCat does fail",
                           ["react-native/run-android/win10-rn0.22/succedsWithOneVSEmulator"], () => {
            fakeExtensionMessageSender.setMessageResponse(Q.reject<void>("Unknown error"));

            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunch("Nexus_5");
                }).then(() => {
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                    return deviceHelper.isAppRunning(androidPackageName);
                }).then(isRunning => {
                    isRunning.should.be.true();
                    shouldHaveReceivedSingleLogCatMessage("Nexus_5");
                });
        });

        testWithRecordings("runApp fails when the android project doesn't exist, and shows a nice error message",
                           ["react-native/run-android/win10-rn0.22/failsDueToAndroidFolderMissing"], () => {
            return Q({})
                .then(() => {
                    return fileSystem.rmdir(androidProjectPath);
                }).then(() => {
                    return simulatedAVDManager.createAndLaunch("Nexus_5");
                }).then(() => {
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                    should.assert(false, "Expected runApp to end up with an error");
                    return false;
                }, reason => {
                    reason.message.should.eql("Android project not found.");
                    return deviceHelper.isAppRunning(androidPackageName);
                }).then(isRunning => {
                    isRunning.should.be.false();
                    shouldHaveReceivedNoLogCatMessages();
                });
        });

        testWithRecordings("runApp fails when the android emulator shell is unresponsive, and shows a nice error message",
                           ["react-native/run-android/win10-rn0.22/fillsomething"], () => {
            return Q({})
                .then(() => {
                    return simulatedAVDManager.createAndLaunch("Nexus_5");
                }).then(() => {
                    // DIEGO TODO: reactNative.forceUnresponsiveShellError();
                    return androidPlatform.runApp(genericRunOptions);
                }).then(() => {
                    should.assert(false, "Expected runApp to end up with an error");
                    return false;
                }, reason => {
                    "An Android shell command timed-out. Please retry the operation.".should.eql(reason.message);
                    return deviceHelper.isAppRunning(androidPackageName);
                }).then(isRunning => {
                    isRunning.should.be.false();
                    shouldHaveReceivedNoLogCatMessages();
                });
        });
    });
});