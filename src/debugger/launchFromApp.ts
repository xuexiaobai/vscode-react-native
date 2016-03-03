// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import {ExtensionMessageSender, ExtensionMessage} from "../common/extensionMessaging";

/* Sample parameters:
...path\launchFromApp.js --vsCodeLocation "C:\Program Files (x86)\Microsoft VS Code\Code.exe"
                         --workspace "c:\workspace\AwesomeApp"
*/

try {
    const extensionMessageSender = new ExtensionMessageSender();
    extensionMessageSender.sendMessage(ExtensionMessage.ATTACH_TO_RUNNING_APP);
} catch (e) {
    throw new Error("Unable to start debugging the application. Try opening your project in VS Code, and starting the debugging session from there.");
}
