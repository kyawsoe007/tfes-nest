import { Document } from 'mongoose';
export interface ExpensesClaim extends Document {
  status: string;
  createdDate: Date;
  claimNo: string;
  userClaim: string;
  getApproval: boolean;
  remark: string;
  claimItems: ClaimItems[];
  approvedBy: string;
  files: string;
}

interface ClaimItems {
  lineNum: number;
  date: Date;
  description: string;
  claimType: string;
  amount: number;
  gstAmt: number;
  currency: string;
  adminRemark: string;
  currencyRate: number;
}
