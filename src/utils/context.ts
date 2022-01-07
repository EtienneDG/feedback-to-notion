import * as vscode from "vscode";
import path = require("path");
import { EditorContext } from "./types";

export function getEditorContext(): EditorContext {
    const result: EditorContext = { path: null, selection: null };
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return result;
    };

    result.path = getShortPathFromFullUri(editor.document.uri);

    const selectedText = editor.document.getText(editor.selection);
    if (selectedText) {
        result.selection = selectedText;
    }

    return result;
}

export function getShortPathFromFullUri(uri: vscode.Uri): string {
    const fullPath = uri.path;
    const workspaceRoot = vscode.workspace.getWorkspaceFolder(uri)?.uri.path;

    // keep the root folder name in the displayed paths for multi root folders workspaces
    if (workspaceRoot) {
        return path.relative(path.join(workspaceRoot, ".."), fullPath);
    }

    return fullPath;
}
