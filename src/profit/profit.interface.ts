import { Document } from "mongoose";

export interface Profit extends Document {
    accountId: string;
    internal: string;
}