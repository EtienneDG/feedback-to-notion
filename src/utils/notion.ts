import { Client } from "@notionhq/client";
import { displayError } from "./logger";
import { NumberType, PeopleType } from "./types";


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

    async createPage(input: string, path: string, selection: string | null): Promise<void> {
        try {
            console.debug("Notion API: create page");
            await this.client.pages.create({
                parent: { database_id: this.databaseId },
                properties: {
                    Feedback: { title: [{ text: { content: input } }] },
                    Counter: { number: 1 },
                    Creator: {
                        people: [{
                            id: this.myPersonId
                        }]
                    },
                    Contributors: {
                        people: [{
                            id: this.myPersonId
                        }]
                    }
                },
                children: this.feedbackToContent(path, selection)
            });
        } catch (error) {
            throw error;
        }
    }

    async updatePage(pageId: string, path: string, selection: string | null): Promise<void> {
        const page: any = await this.client.pages.retrieve({ page_id: pageId });
        const previousCounter = (page.properties.Counter as NumberType).number || 0;
        const existingReporters = (page.properties.Contributors as PeopleType).people;

        const reporters = [{ id: this.myPersonId }].concat(existingReporters);

        console.debug(`Notion API: update page ${pageId}`);
        try {
            await this.client.pages.update({
                page_id: pageId,
                properties: {
                    Counter: { number: previousCounter + 1 },
                    Contributors: {
                        people: reporters
                    }


                }
            });
            await this.client.blocks.children.append({
                block_id: pageId,
                children: this.feedbackToContent(path, selection)
            });
        } catch (error) {
            throw error;
        }
    }
    private feedbackToContent(path: string, selection: string | null) {
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
                        { text: { content: " " } },
                        {
                            mention: {
                                user: {
                                    id: this.myPersonId
                                }
                            }
                        },

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