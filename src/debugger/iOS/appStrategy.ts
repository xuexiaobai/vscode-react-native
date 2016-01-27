import * as path from "path";
import {iOS} from "../../utils/iOS/ios";
import {AppDebugMode} from "./appDebugMode";
import {IAppStrategy} from "../appStrategy";
import {Package} from "../../utils/npm/package";
import {Project} from "../../utils/ios/project"; // TODO: Remove this import

interface DeviceInformation {
    name: any;
    id: any;
    runtime: any;
}

export class AppStrategy implements IAppStrategy {
    private target: string;
    private deviceInformation: DeviceInformation;

    private reactNativeProject: Package;
    private iosProject: Project; // TODO: Replace this with iOS.Project

    constructor(reactNativeProject: Package) {
        this.reactNativeProject = reactNativeProject;
        this.iosProject = new iOS.Project(path.join(this.reactNativeProject.path(), "ios"));
    }

    public runApp () {
        this.target = new iOS.Deployer(this.iosProject).chooseSimulator();
        this.deviceInformation = new iOS.DevicesInformation().getDeviceFromTarget(this.target);
        console.log("Target: " + this.target + " deviceId: " + this.deviceInformation.id);
        return new AppDebugMode(this.reactNativeProject, this.iosProject).disable()
            .then(() =>
                new iOS.Runner(this.iosProject, "Debug").run({}),
            () =>
                new iOS.Runner(this.iosProject, "Debug").run({}));
        // TODO: Refactor previous line to something better
    }

    public enableJSDebuggingMode() {
        return new AppDebugMode(this.reactNativeProject, this.iosProject).enable();
    }
}
