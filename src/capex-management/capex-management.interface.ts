import { Document } from 'mongoose';

export enum DepreciationType{
     Monthly = 'Monthly',
     Yearly='Yearly'
 }
export interface CapexManagement extends Document{
     name: string;
     purchase_value: number;
     outstanding_loan: number;
     residual_amount:number;
     monthly_installment:number;
     loan_installment:number;
     months_left: string;
     remarks: string;
     life_span: number;
     purchase_date: Date;
     depreciation_type: DepreciationType;
     bank: string;
     loan_duration: number;
     payment_startdate: Date;
     transferDate: Date;
     loanDepositDate: Date;
     interest_rate: number;
     loan_amount: number;
     active:boolean;
     debit_account:string;
     credit_account:string;
     journalsCreated: any;
     loanJournalsCreated:any;
     loan_debit_account:string;
     loan_credit_account:string;
     loan_interest_account:string;
}