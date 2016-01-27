import * as Q from "q";
import * as path_module from "path";
import * as shelljs from "shelljs";

export class Project {
    private _path: string;
    private _name: Q.Promise<string>;

    constructor(path: string) {
        this._path = path;
    }

    public get name(): Q.Promise<string> {
        if (!this._name) {
            this._name = this.obtainName();
        }

        return this._name;
    }

    public get path(): string {
        return this._path;
    }

    /**
     * Searches for first XCode project in specified folder
     * @param  {String} projectPath Path where to search project
     * @return {Promise}            Promise either fulfilled with project name or rejected
     */
    private obtainName(): Q.Promise<string> {
        // "Searching for Xcode project in " + projectPath);
        let xcodeProjFiles = shelljs.ls(this._path).filter(function (name) {
            return path_module.extname(name) === ".xcodeproj";
        });

        if (xcodeProjFiles.length === 0) {
            return Q.reject<string>("No Xcode project found in " + this._path);
        }
        if (xcodeProjFiles.length > 1) {
            console.log("warn", "Found multiple .xcodeproj directories in \n" +
                this._path + "\nUsing first one");
        }

        let projectName = path_module.basename(xcodeProjFiles[0], ".xcodeproj");
        return Q.resolve(projectName);
    }
}
