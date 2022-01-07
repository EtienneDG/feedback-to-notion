import { Command } from "vscode";
import * as vscode from "vscode";


export interface ExtensionCommand extends Command {
    handler: (...args: any[]) => void;
}

export class CommandManager {
    private readonly commands = new Map<string, vscode.Disposable>();

    public dispose() {
        for (const registeredCommand of this.commands.values()) {
            registeredCommand.dispose();
        }
        this.commands.clear();
    }

    public register(c: ExtensionCommand) {
        this.registerCommand(c.command, c.handler, c.arguments);
    }

    private registerCommand(
        id: string,
        impl: (...args: any[]) => void,
        thisArg?: any
    ) {
        if (this.commands.has(id)) {
            return;
        }
        this.commands.set(id, vscode.commands.registerCommand(id, impl, thisArg));
    }
}
