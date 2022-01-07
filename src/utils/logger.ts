import * as vscode from "vscode";

export const extensionLogger = vscode.window.createOutputChannel("Feedback to Notion");

export function displayError(message: string, error: any): void {
    vscode.window.showErrorMessage(message, "Details").then((value) => {
        extensionLogger.appendLine(error.message);
        extensionLogger.appendLine(error.stack);

        if (value === "Details") {
            extensionLogger.show();
        }
    });
}