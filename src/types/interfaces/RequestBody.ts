import { Mode, RuleType } from '../common.js';

export interface Data {
    values: string[];
    mode: Mode;
    type: RuleType;
    ids?: number[];
    active?: boolean;
}
