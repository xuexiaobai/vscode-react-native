// commands to use:
// /usr/libexec/PlistBuddy -c "Add :RCTDevMenu:executorClass string RCTWebSocketExecutor" org.reactjs.native.example.app-for-vs-code-extension.plist


// /Users/digeff/Library/Developer/CoreSimulator/Devices/218C3A6E-4148-4039-AC68-F260C3572CEB/data/Containers/Data/Application/6C2C3335-1C37-4E46-AA60-4004B38D1A59/Library/Preferences

// /usr/libexec/PlistBuddy -c "Add :RCTDevMenu:executorClass string RCTWebSocketExecutor" org.reactjs.native.example.app-for-vs-code-extension.plist
// /usr/libexec/PlistBuddy -c Print org.reactjs.native.example.app-for-vs-code-extension.plist
// /usr/libexec/PlistBuddy -c "Delete :RCTDevMenu:executorClass" org.reactjs.native.example.app-for-vs-code-extension.plist
// /usr/libexec/PlistBuddy -c Print org.reactjs.native.example.app-for-vs-code-extension.plist
// find ~/Library/Developer/CoreSimulator/Devices/218C3A6E-4148-4039-AC68-F260C3572CEB/data/Containers/Data/Application/ -name *app-for-vs-code*.plist

// replace find with glob

import {iOS} from "../../utils/iOS/ios";
import {Project} from "../../utils/iOS/project"; // TODO: Remove this import
import {PlistBuddyEditor} from "../../utils/osx/plistBuddyEditor";
import {Package} from "../../utils/npm/package";
import {Log} from "../../utils/commands/log";
import * as Q from "q";

export class AppDebugMode {
    private executorClassEntry = ":RCTDevMenu:executorClass";

    private reactNativeProject: Package;
    private iosProject: Project; // TODO: Replace this with iOS.Project
    private log = new Log();

    private ENABLE_DEBUGGING_IN_APP_PREFERENCES_TITLE = "Enable Debugging in React-Native App preferences";
    private RESTART_REACT_NATIVE_APP_TITLE = "Re-start the React-Native App in Debug Mode";

    constructor(reactNativeProject: Package, iosProject: Project) { // TODO: Replace this with iOS.Project
        this.reactNativeProject = reactNativeProject;
        this.iosProject = iosProject;
    }

    public enable() {
        // TODO: Implement this
        return Q({})
            .then(() => this.log.commandStarted(this.ENABLE_DEBUGGING_IN_APP_PREFERENCES_TITLE))
            .then(() => this.plistEditor())
            .then(editor => editor.addOrSet(this.executorClassEntry, "RCTWebSocketExecutor"))
            .then(() => this.log.commandEnded(this.ENABLE_DEBUGGING_IN_APP_PREFERENCES_TITLE))
            .then(() => this.log.commandStarted(this.RESTART_REACT_NATIVE_APP_TITLE))
            .then(() => new iOS.Deployer(this.iosProject).justDeployToSimulator({}))
            .then(() => this.log.commandEnded(this.RESTART_REACT_NATIVE_APP_TITLE));
    }

    public disable() {
        // TODO: Implement this
        return Q({})
            .then(() => this.plistEditor())
            .then(editor => editor.delete(this.executorClassEntry));
    }

    private plistEditor(): Q.Promise<PlistBuddyEditor> {
        return this.reactNativeProject.name()
            .then(projectName => new iOS.FindAppPFile(projectName).find()
            .then(filePath => new PlistBuddyEditor(filePath)));
    }
}