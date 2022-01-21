import { Client } from "@notionhq/client";
import { displayError } from "./logger";
import { NumberType, TagsType } from "./types";


/* eslint-disable @typescript-eslint/naming-convention */
export class Notion {
    client: Client;

    constructor(token: string, private databaseId: string, private myPersonId: string) {
        if (!token || !databaseId || !myPersonId) {
            displayError(
                "[Notion]Missing configuration for the extension to work poperly.",
                {
                    message: `Actual configuration :
                 token: ${token || "MISSING"}
                 databaseId: ${databaseId || "MISSING"}
                 myPersonId: ${myPersonId || "MISSING"}`,
                }
            );
        }
        this.client = new Client({ auth: token });
    }

    async getUser(userId: string): Promise<any> {
        return this.client.users.retrieve({
            user_id: userId
        });
    }

    async getPages(query: string): Promise<any> {
        console.debug("Notion API: query database");
        let { results } = await this.client.databases.query({
            database_id: this.databaseId,
            filter: {
                or: [
                    { property: "Feedback", text: { contains: query } },
                    { property: "Tags", multi_select: { contains: query } },
                ]
            },
        });
        return results;
    }

    async createPage(input: string, path: string, selection: string | null): Promise<string> {
        try {
            console.debug("Notion API: create page");
            const user = await this.getUser(this.myPersonId);
            const createdPage: any = await this.client.pages.create({
                parent: { database_id: this.databaseId },
                properties: {
                    Feedback: { title: [{ text: { content: input } }] },
                    Counter: { number: 1 },
                    Creator: {
                        select: {
                            name: user.name
                        }
                    },
                    Contributors: {
                        multi_select: [{
                            name: user.name
                        }]
                    }
                },
                children: this.feedbackToContent(path, selection, user)
            });
            return createdPage.url;
        } catch (error) {
            throw error;
        }
    }

    async updatePage(pageId: string, path: string, selection: string | null): Promise<string> {
        const page: any = await this.client.pages.retrieve({ page_id: pageId });
        const user = await this.getUser(this.myPersonId);
        const previousCounter = (page.properties.Counter as NumberType).number || 0;
        const existingReporters = (page.properties.Contributors as TagsType).multi_select;

        const reporters = [{ name: user.name }].concat(existingReporters);

        console.debug(`Notion API: update page ${pageId}`);
        try {
            const updatedPage: any = await this.client.pages.update({
                page_id: pageId,
                properties: {
                    Counter: { number: previousCounter + 1 },
                    Contributors: {
                        multi_select: reporters
                    }


                }
            });
            await this.client.blocks.children.append({
                block_id: pageId,
                children: this.feedbackToContent(path, selection, user)
            });
            return updatedPage.url;
        } catch (error) {
            throw error;
        }
    }

    private feedbackToContent(path: string, selection: string | null, user: any) {
        const today = new Date().toISOString().split("T")[0];
        const content: any = [
            {
                heading_1: {
                    text: [
                        {
                            mention: {
                                date: {
                                    start: today
                                }
                            }
                        },
                        { text: { content: ` ${user.name}` } }
                    ]
                }
            },
            {
                paragraph: {
                    text: [
                        { text: { content: path } }
                    ]
                }
            },
        ];

        if (selection) {
            content.push({
                code: {
                    language: "plain text",
                    text: [
                        { text: { content: selection } }
                    ]
                }
            });
        }

        return content;
    }
}