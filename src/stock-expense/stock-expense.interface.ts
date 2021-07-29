import {Document} from 'mongoose';

export interface StockExpense extends Document{
     status?:string;
    tfesPic:string;
    date:Date;
    remarks:string;
    stockExpenseItem:StockExpenseItem[]
}

export interface StockExpenseItem{
    SN:number;
    description:string;
    qty:number;
    reason:string;
    skuId:string;
    productId:string;
}