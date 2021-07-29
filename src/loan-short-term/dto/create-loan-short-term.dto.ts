
import { ApiProperty } from '@nestjs/swagger';

class LoanListDto {
    date: Date;
    amount: number;
    interestAmount: number;
    miscellaneous_amount:number;
    account:string;
    journalId: string
}

export class CreateLoanShortTermDto {
    loanName: string;
  bank: string;
  paymentStartDate: Date;
  loanAmount: number;
  poNumber: string;  
  debit_account: string;
  credit_account:string;
  interest_account:string;
  suppId: string;
  active:boolean;
  loanList: LoanListDto[];
  currency:string;
}