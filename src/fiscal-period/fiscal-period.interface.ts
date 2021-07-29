import {Document} from 'mongoose';

export interface FiscalPeriod extends Document{
startOfDate:Date;
endOfDate:Date;
monthly_status:FiscalStatus;
monthly_code:string;
periodName:string;
fiscalYear:string;
// monthlyPeriod:MonthlyPeriod[];
}
export interface MonthlyPeriod{
startOfDate:Date;
endOfDate:Date;
monthly_status:FiscalStatus;
monthly_code:string;
periodName:string;
}
export enum FiscalStatus{
    Open='Open',
    Close='Close'
}