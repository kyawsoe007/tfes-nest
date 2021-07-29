import { Document } from 'mongoose';

export interface JournalEntry extends Document {
    readonly status?: string;
    journalEntryNum: string;
    period: string;
    reference: string;
    toReview: boolean;
    journalItems: JournalItem[];
    remarks: string;
    journalValue: string;
    totalDebit: number;
    totalCredit: number;
    entryDate: Date;
    modelId: string;
    modelName: string;
    isOpening: boolean;
}

export interface JournalItem {
  set?: any;
  account: string;
  amountCurrency: number;
  credit: number;
  debit: number;
  currency: string;
  dueDate: string;
  name: string;
  partialReconcile: string;
  partner: string;
  reconcile: string;
  taxAmount: number;
  reference: string;
}
