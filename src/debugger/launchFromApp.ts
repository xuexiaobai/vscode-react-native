// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import {ExtensionMessage, MessagingChannel} from "../common/extensionMessaging";
import {InterProcessMessageSender} from "../common/interProcessMessageSender";

/* Sample parameters:
...path\launchFromApp.js --vsCodeLocation "C:\Program Files (x86)\Microsoft VS Code\Code.exe"
                         --workspace "c:\workspace\AwesomeApp"
*/

try {
    // TODO: Get the projectRootPath from the --workspace
    if (1 === 1) {
        throw Error("Implement the TODO");
    }
    const projectRootPath = "";
    const remoteExtensionServerPath = new MessagingChannel(projectRootPath).getPath();
    const interProcessMessageSender = new InterProcessMessageSender(remoteExtensionServerPath);
    interProcessMessageSender.sendMessage(ExtensionMessage.ATTACH_TO_RUNNING_APP);
} catch (e) {
    throw new Error("Unable to start debugging the application. Try opening your project in VS Code, and starting the debugging session from there.");
}
