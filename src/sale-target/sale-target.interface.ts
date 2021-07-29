import { Document } from 'mongoose';

export interface SaleTarget extends Document{
    readonly name:string;
    readonly target:number;
}