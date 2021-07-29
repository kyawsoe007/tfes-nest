import { Document } from 'mongoose';
export interface LoanLongTerm extends Document {
  name: string;
  bank: string;
  paymentStartDate: Date;
  transferDate: Date;
  loanDepositDate: Date;
  loanAmount: number;  
  loanDuration: number;
  monthlyInstall: number;
  debit_account: string;
  credit_account: string;
  interest_account:string;
  interestRate: number;
  currency: string;
  active: boolean;
  loanJournalsCreated:any;
  //loanList: any[];
}
