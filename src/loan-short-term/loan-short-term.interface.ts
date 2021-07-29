import { Document } from 'mongoose';
export interface LoanShortTerm extends Document {
  loanName: string;
  bank: string;
  startDate: Date;
  loanAmount: number;
  poNumber: string;
  debit_account: string;
  credit_account: string;
  interest_account:string;
  suppId: string;
  active: boolean;
  loanList: LoanList[];
  currency: string;
}

export interface LoanList {
  set?:any;
  date: Date;
  amount: number;
  interestAmount: number;
  miscellaneous_amount:number;
  account:string;
  journalId:string;
  balance?: number;
}
