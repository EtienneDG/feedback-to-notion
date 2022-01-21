import path = require("path");
import * as vscode from "vscode";

import { ExtensionCommand } from "../utils/commands";
import { getEditorContext, getShortPathFromFullUri } from "../utils/context";
import { displayError } from "../utils/logger";
import { MenuItem } from "../utils/menuItem";
import { Notion } from "../utils/notion";

export class AddFeedback implements ExtensionCommand {
    readonly createFeedbackMenuItem = new MenuItem("$(plus) Create new feedback", undefined, undefined, true);
    command: string;
    title: string;

    quickPick: vscode.QuickPick<vscode.QuickPickItem>;
    menuItems: MenuItem[] = [this.createFeedbackMenuItem];

    notion: Notion;

    context: any;

    constructor(command: string, title: string) {
        this.command = command;
        this.title = title;
        const { token, databaseId, myPersonId } = vscode.workspace.getConfiguration("notion");
        this.notion = new Notion(token, databaseId, myPersonId);
        this.quickPick = vscode.window.createQuickPick();
    }

    handler = async (uri?: vscode.Uri) => {
        this.context = uri ? { path: getShortPathFromFullUri(uri), selection: null } : getEditorContext();

        // Refresh client : configuration might have changed
        const { token, databaseId, myPersonId } = vscode.workspace.getConfiguration("notion");
        this.notion = new Notion(token, databaseId, myPersonId);

        // initial call to get first pages
        const results = await this.notion.getPages("");
        this.menuItems.push(...results.map((page: any) => MenuItem.pageToMenuItem(page)));

        this.quickPick = vscode.window.createQuickPick();
        this.quickPick.placeholder = "Upvote an existing feedback or create a new one";
        this.quickPick.items = this.menuItems;
        this.quickPick.matchOnDetail = true;

        this.quickPick.onDidChangeValue(async (query: string) => {
            // min active items == number of always shown items == 1
            if (this.quickPick.activeItems.length !== 1) {
                console.debug("Still active items displayed");
                return;
            }

            // try to fetch other matching pages from notion
            const results = await this.notion.getPages(query);

            if (results.length !== 0) {
                this.menuItems += results.map((page: any) => MenuItem.pageToMenuItem(page));
            }
            else {
                console.debug("No remote results found");
            }
        });

        this.quickPick.onDidAccept(async () => {
            this.context = getEditorContext();
            if (!this.context.path) {
                throw new Error("No path found...");
            }
            let promise = null;
            if (this.quickPick.selectedItems[0] === this.createFeedbackMenuItem) {
                // TODO: what about tags ? Multi steps ?
                promise = this.notion.createPage(this.quickPick.value, this.context.path, this.context.selection);
            }
            else {
                promise = this.notion.updatePage((this.quickPick.selectedItems[0] as any).pageId, this.context.path, this.context.selection);
            }

            promise
                .then((url) => {
                    const buttonText = "See on Notion";
                    vscode.window.showInformationMessage("Feedback sent to Notion.", buttonText).then(value => {
                        if (value === buttonText) {
                            vscode.env.openExternal(vscode.Uri.parse(url));
                        }
                    });
                })
                .catch((error) => displayError("An error occured during API call", error))
                .finally(() => {
                    this.quickPick.hide();
                    // reset the menu with only the default item for creating feedback
                    this.menuItems = [this.createFeedbackMenuItem];
                });
        });

        this.quickPick.onDidHide(() => {
            this.quickPick.dispose();
        });

        this.quickPick.show();
    };
}