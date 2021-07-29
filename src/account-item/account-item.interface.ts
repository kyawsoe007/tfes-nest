import { Document } from 'mongoose';

export enum internalType{
    View = 'View',
    Regular = 'Regular',
    Receviable = 'Receviable',
    Payable = 'Payable',
    Liquidity='Liquidity'
}

export interface AccountItem extends Document{
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
    balance: Number;
    internalType: string;
    companyCurrency: string;
}
