// commands to use:
// /usr/libexec/PlistBuddy -c "Add :RCTDevMenu:executorClass string RCTWebSocketExecutor" org.reactjs.native.example.app-for-vs-code-extension.plist


// /Users/digeff/Library/Developer/CoreSimulator/Devices/218C3A6E-4148-4039-AC68-F260C3572CEB/data/Containers/Data/Application/6C2C3335-1C37-4E46-AA60-4004B38D1A59/Library/Preferences


// /usr/libexec/PlistBuddy -c "Add :RCTDevMenu:executorClass string RCTWebSocketExecutor" org.reactjs.native.example.app-for-vs-code-extension.plist
// /usr/libexec/PlistBuddy -c Print org.reactjs.native.example.app-for-vs-code-extension.plist
// /usr/libexec/PlistBuddy -c "Delete :RCTDevMenu:executorClass" org.reactjs.native.example.app-for-vs-code-extension.plist
// /usr/libexec/PlistBuddy -c Print org.reactjs.native.example.app-for-vs-code-extension.plist
// find ~/Library/Developer/CoreSimulator/Devices/218C3A6E-4148-4039-AC68-F260C3572CEB/data/Containers/Data/Application/ -name *app-for-vs-code*.plist

// replace find with glob

import {Node} from "../node/node";

enum EditingCommand {
    // "man PlistBuddy"" for the full list
    Add,
    Print,
    Delete,
    Set
}

export class PlistBuddyEditor {
    private filePath: string;
    private PListBuddyLocation = "/usr/libexec/PlistBuddy";

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    public add(entry: string, value: string): Q.Promise<string> {
        return this.execute(EditingCommand.Add, entry, "string", value);
    }

    public set(entry: string, value: string): Q.Promise<string> {
        return this.execute(EditingCommand.Set, entry, value);
    }

    public addOrSet(entry: string, value: string): Q.Promise<string> {
        // First we try to set the value, in case the entry already exists
        // If that fails, we then try to add the entry
        return this.set(entry, value)
            .fail(reason => this.add(entry, value));
    }

    public delete(entry: string): Q.Promise<string> {
        return this.execute(EditingCommand.Delete, entry);
    }

    public print(): Q.Promise<string> {
        return this.execute(EditingCommand.Print);
    }

    private execute(editingCommand: EditingCommand, ...extras: string[]): Q.Promise<string> {
        let plistBuddyCommand = " -c \"" + EditingCommand[editingCommand] + " " + extras.join(" ") + "\"";
        let commandLineCommand = this.PListBuddyLocation + " " + plistBuddyCommand + " " + this.filePath;
        return new Node.ChildProcess().execToString(commandLineCommand);
    }
}