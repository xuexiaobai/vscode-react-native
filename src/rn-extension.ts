// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import {FileSystem} from "./utils/node/fileSystem";
import * as http from "http";
import * as path from "path";
import * as vscode from "vscode";
import {CommandPaletteHandler} from "./utils/commandPaletteHandler";
import {ReactNativeProjectHelper} from "./utils/reactNativeProjectHelper";
import {ReactDirManager} from "./utils/reactDirManager";
import {TsConfigHelper} from "./utils/tsconfigHelper";
import * as Q from "q";
import {Packager} from "./debugger/packager";
import {Log} from "./utils/commands/log";
import {PlatformResolver} from "./debugger/platformResolver";
import {IRunOptions} from "./debugger/launchArgs";
import * as android from "./debugger/android/androidPlatform";

export function activate(context: vscode.ExtensionContext): void {
    let reactNativeProjectHelper = new ReactNativeProjectHelper(vscode.workspace.rootPath);
    reactNativeProjectHelper.isReactNativeProject().then(isRNProject => {
        if (isRNProject) {
            setupReactNativeDebugger();
            setupReactNativeIntellisense();
            setupExtensionServer();
            context.subscriptions.push(new ReactDirManager());
        }
    });

    let commandPaletteHandler = new CommandPaletteHandler(vscode.workspace.rootPath);

    // Register React Native commands
    context.subscriptions.push(vscode.commands.registerCommand("reactNative.runAndroid",
        () => commandPaletteHandler.runAndroid()));
    context.subscriptions.push(vscode.commands.registerCommand("reactNative.runIos",
        () => commandPaletteHandler.runIos()));
    context.subscriptions.push(vscode.commands.registerCommand("reactNative.startPackager",
        () => commandPaletteHandler.startPackager()));
    context.subscriptions.push(vscode.commands.registerCommand("reactNative.stopPackager",
        () => commandPaletteHandler.stopPackager()));
    context.subscriptions.push(vscode.commands.registerCommand("reactNative.reloadDebugger",
        () => commandPaletteHandler.restartDebugger()));
}

var counter = 0;
// var needRestart = false;
var justRestarted = false;

/**
 * Sets up the extension message server.
 */
function setupExtensionServer(): void {
    console.log("Setting up extension server......");
    let requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {
        console.log("Method: " + request.method);
        console.log("URL: " + request.url);
        // let body = "";
        // request.on('readable', function() {
        //     body += request.read();
        // });
        //         request.on('end', function() {
        //
        //         });
        handleIncomingMessage(request.url)
            .then(() => {
                return response.end("OK");
            })
            .done();
    }

    let server = http.createServer(requestHandler);
    server.listen(8099, null, null, () => { console.log("Extension is ready to process messages."); });
}

function prepareEnvironment(projectRootPath: string): Q.Promise<void> {
    let resolver = new PlatformResolver();
    let runOptions = parseRunOptions(projectRootPath);
    // let mobilePlatform = resolver.resolveMobilePlatform(runOptions.platform);
    let mobilePlatform = new android.AndroidPlatform();

    let sourcesStoragePath = path.join(projectRootPath, ".vscode", ".react");
    let packager = new Packager(projectRootPath, sourcesStoragePath);

    return packager.isRunning().then(running => {
        if (!running) {
            return Q({})
                .then(() => packager.start())
                .then(() => console.log("packager started, prewarming bundle cache"))
                // We've seen that if we don't prewarm the bundle cache, the app fails on the first attempt to connect to the debugger logic
                // and the user needs to Reload JS manually. We prewarm it to prevent that issue
                .then(() => packager.prewarmBundleCache("android"))
                .then(() => console.log("bundle cache prewarmed, running app"))
                .then(() => mobilePlatform.runApp(runOptions))
                .then(() => console.log("application ran. done."))
                // .then(() => new MultipleLifetimesAppWorker(sourcesStoragePath).start()) // Start the app worker
                // .then(() => mobilePlatform.enableJSDebuggingMode(runOptions))
                .catch(reason => {
                    Log.logError("Cannot debug application.", reason);
                });
        }
    });
}

/**
 * Parses the launch arguments set in the launch configuration.
 */
function parseRunOptions(projectRootPath: string): IRunOptions {
    let result: IRunOptions = { projectRoot: projectRootPath };

    if (process.argv.length > 2) {
        result.platform = process.argv[2].toLowerCase();
    }

    result.target = process.argv[3];
    return result;
}

function handleIncomingMessage(requestBody: string): Q.Promise<void> {
    console.log("Handling message number: " + counter++);
    return Q({})
        .then(() => {
            console.log("Handling extension message: " + requestBody);
            switch (requestBody) {
                case "/prepare":
                    return prepareEnvironment(path.resolve(vscode.workspace.rootPath));
                case "/restartneeded":
                    if (!justRestarted) {
                        justRestarted = true;
                        setTimeout(function() {
                            justRestarted = false;
                        }, 3000);
                        return vscode.commands.executeCommand("workbench.action.debug.restart").then(() => null);
                    }
                    break;
                case "/restart":
                // return Q({})
                //     .then(() => {
                //         if (needRestart) {
                //             justRestarted = true;
                //             vscode.commands.executeCommand("workbench.action.debug.restart");
                //             needRestart = false;
                //         } else {
                //             console.log("Skipping restart...");
                //         }
                //     });

                default:
                    return;
            }
        });
}

/**
 * Sets up the debugger for the React Native project by dropping
 * the debugger stub into the workspace
 */
function setupReactNativeDebugger(): void {
    let launcherPath = require.resolve("./debugger/launcher");
    let pkg = require("../package.json");
    const extensionVersionNumber = pkg.version;
    const extensionName = pkg.name;

    let debuggerEntryCode =
        `// This file is automatically generated by ${extensionName}@${extensionVersionNumber}
// Please do not modify it manually. All changes will be lost.
try {
    var path = require("path");
    var Launcher = require(${JSON.stringify(launcherPath)}).Launcher;
    new Launcher(path.resolve(__dirname, "..")).launch();
} catch (e) {
    throw new Error("Unable to launch application. Try deleting .vscode/launchReactNative.js and restarting vscode.");
}`;

    let vscodeFolder = path.join(vscode.workspace.rootPath, ".vscode");
    let debugStub = path.join(vscodeFolder, "launchReactNative.js");
    let fsUtil = new FileSystem();

    fsUtil.ensureDirectory(vscodeFolder)
        .then(() => fsUtil.ensureFileWithContents(debugStub, debuggerEntryCode))
        .catch((err: Error) => {
            vscode.window.showErrorMessage(err.message);
        });
}

function setupReactNativeIntellisense(): void {
    if (!process.env.VSCODE_TSJS) {
        return;
    }

    // Enable JavaScript intellisense through Salsa language service
    TsConfigHelper.allowJs(true).done();

    let reactTypingsSource = path.resolve(__dirname, "..", "ReactTypings");
    let reactTypingsDest = path.resolve(vscode.workspace.rootPath, ".vscode", "typings");
    let fileSystem = new FileSystem();

    fileSystem.copyRecursive(reactTypingsSource, reactTypingsDest).done();
}
