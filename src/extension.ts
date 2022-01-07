// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CommandManager } from "./utils/commands";
import { AddFeedback } from "./commands/addFeedback";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(registerCommands());
}

function registerCommands(): vscode.Disposable {
	const commandManager = new CommandManager();
	commandManager.register(new AddFeedback("feedback-to-notion.addFeedbackToSelection", "Add feedback to selection"));
	commandManager.register(new AddFeedback("feedback-to-notion.addFeedbackToFileFromExplorer", "Add feedback to file"));
	commandManager.register(new AddFeedback("feedback-to-notion.addFeedbackToFileFromEditor", "Add feedback to file"));
	return commandManager;
}


// this method is called when your extension is deactivated
export function deactivate() { }
