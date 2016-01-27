// replace find with glob

import {Node} from "../node/node";

export class Find {
    private commandName = "find";
    private filterByNameKey = "-name";

    public singleByName(pathToSearch: string, name: string): Q.Promise<string> {
        return this.byName(pathToSearch, name).then(filePaths => {
            if (filePaths.length < 0) {
                throw new RangeError("No files were found with the name " + name + " in " + pathToSearch);
            } else if (filePaths.length >= 2) {
                throw new RangeError("Multiple files were found with the name " + name + " in " + pathToSearch
                 + "\nFiles: " + filePaths.join("\n"));
            } else {
                return filePaths[0];
            }
        });
    }

    public byName(pathToSearch: string, name: string): Q.Promise<string[]> {
        return this.execute(pathToSearch, this.filterByNameKey, name);
    }

    private execute(pathToSearch: string, ...extras: string[]): Q.Promise<string[]> {
        let commandLineCommand = this.commandName + " " + pathToSearch + " " + extras.join(" ");
        let childProcess = new Node.ChildProcess();
        return childProcess.execToString(commandLineCommand)
            .then(filenames => {
                // Then we split in case we got several results, and we filter out empty results
                return filenames.split("\n").filter(filename => filename.length > 0);
            });
    }
}