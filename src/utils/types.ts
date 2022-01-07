/* NOTION */
/* eslint-disable-next-line @typescript-eslint/naming-convention */
export type TagsType = { multi_select: any[] };
export type NumberType = { number: number };
export type PeopleType = { people: { id: string }[] };

/* CONTEXT */
export type EditorContext = { path: string | null, selection: string | null };
