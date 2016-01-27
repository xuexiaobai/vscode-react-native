import * as Q from "q";
import {CommandExecutor} from "../../utils/commands/commandExecutor";
import {Package} from "../../utils/npm/package";

export class AppDebugMode {
    private reactNativeProject: Package;

    private command(): Q.Promise<string> {
        return this.reactNativeProject.name()
            .then(projectName => {
                let projectNameForIntent = projectName.toLowerCase(); // e.g.: reactnativetestapp
                return "adb shell am broadcast -a \"com." + projectNameForIntent + ".RELOAD_APP_ACTION\" --ez jsproxy true";
            });
    }

    constructor(reactNativeProject: Package) {
        this.reactNativeProject = reactNativeProject;
    }

    public enable(): Q.Promise<void> {
        return this.command()
            .then(command =>
                new CommandExecutor(this.reactNativeProject.path()).execute("Reload Android App in Debugging Mode", command));
    }
}