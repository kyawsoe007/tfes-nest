import { ApiProperty } from '@nestjs/swagger';
export class CreateLoanLongTermDto {
  name: string;
  bank: string;
  loanDepositDate: Date;
  paymentStartDate: Date;
  loanAmount: number;
  loanDuration: number;
  monthlyInstall: number;
  debit_account: string;
  credit_account:string;
  interest_account:string;
  active:boolean;
}