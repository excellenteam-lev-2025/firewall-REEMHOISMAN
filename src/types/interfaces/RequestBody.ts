
import { Mode, RuleType } from '../common.js';

export interface Data {
    values: string[];
    mode: Mode;
    type: RuleType;
    ids?: number[];
    active?: boolean;
}

export interface UpdateData {
    ids: number[];
    mode: Mode;
    active: boolean;
}

export type UpdateReqBody = Record<string, UpdateData>;
