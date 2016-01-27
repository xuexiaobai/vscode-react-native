// TODO: replace find with glob

import {Find} from "../osx/find";

export class FindAppPFile {
    private iPhoneSimulatorStoragePath = "~/Library/Developer/CoreSimulator/Devices/*/data/Containers/Data/Application/";

    private projectName: string;

    constructor(projectName: string) {
        this.projectName = projectName;
    }

    private fileNamePattern(): string {
        return "*" + this.projectName + ".plist"; // e.g.: "*ReactNativeTestApp.plist"
    }

    public find(): Q.Promise<string> {
        return new Find().singleByName(this.iPhoneSimulatorStoragePath, this.fileNamePattern());
    }
}