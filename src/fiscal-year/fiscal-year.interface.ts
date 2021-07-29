import {Document} from 'mongoose';

export enum FiscalStatus{
    Open='Open',
    Close='Close'
}
export enum FiscalStatusByMonthly{
    Open='Open',
    Close='Close'
}
export interface FiscalYear extends Document{
    code:string;
    fiscalYear:string;
    status:FiscalStatus;
    startDate:Date;
    endDate:Date;
    // monthlyPeriod:string;
}
// export interface MonthlyPeriod{
// startOfDate:Date;
// endOfDate:Date;
// monthly_code:string;
// periodName:string;
// monthly_status:FiscalStatusByMonthly;
// }
