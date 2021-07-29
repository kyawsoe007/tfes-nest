import { Document } from "mongoose";

export interface BalanceSheet extends Document {
    internalType: string;
    levelOne: string;
    levelTwo: levelTwo[]
}
export interface levelTwo {
    set: any;
    accountId: string;
}