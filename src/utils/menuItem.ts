import * as vscode from "vscode";
import { TagsType } from "./types";

export class MenuItem implements vscode.QuickPickItem {
    public picked?: boolean;

    constructor(
        public label: string,
        public detail?: string,
        public pageId?: string,
        public alwaysShow?: boolean | undefined) {
    }

    static pageToMenuItem(page: any): MenuItem {
        /* eslint-disable-next-line @typescript-eslint/naming-convention */
        const title = (page.properties["Feedback"] as { title: { plain_text: string }[] }).title[0]?.plain_text;

        /* eslint-disable-next-line @typescript-eslint/naming-convention */
        const tags = (page.properties.Tags as TagsType).multi_select;
        const tagNames = tags.map((tag: { id: string, name: string }) => tag.name);
        const tagAsString = tagNames.map(t => `$(tag) ${t}`).join(" ");

        return new MenuItem(title, tagAsString, page.id);
    }
}
