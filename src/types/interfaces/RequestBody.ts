
export interface Data {
    values: string[],
    mode: string,
    type: string;
    ids?: number[]
    active?: boolean;
}

export interface UpdateData {
    ids: number[];
    mode: string;
    active: boolean;
}

export type UpdateReqBody = Record<string, UpdateData>;
