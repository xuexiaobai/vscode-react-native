import {IAppStrategy} from "../appStrategy";
import {CommandExecutor} from "../../utils/commands/commandExecutor";
import {AppDebugMode} from "./appDebugMode";
import {Package} from "../../utils/npm/package";

export class AppStrategy implements IAppStrategy {
    private reactNativeProject: Package;

    constructor(reactNativeProject: Package) {
        this.reactNativeProject = reactNativeProject;
    }

    public runApp (): Q.Promise<void> {
        return new CommandExecutor(this.reactNativeProject.path()).execute("Run Android", "react-native run-android");
    }

    public enableJSDebuggingMode(): Q.Promise<void> {
        return new AppDebugMode(this.reactNativeProject).enable();
    }
}
