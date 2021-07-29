import { Module } from '@nestjs/common';
import { LoanLongTermService } from './loan-long-term.service';
import { LoanLongTermController } from './loan-long-term.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanLongTermSchema } from './schemas/loan-long-term.schema';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { CurrenciesModule } from 'src/currencies/currencies.module';
import { SupplierInvoiceModule } from 'src/supplier-invoice/supplier-invoice.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LoanLongTerm', schema: LoanLongTermSchema },
    ]),
    AccountItemModule,
    JournalEntryModule,
    CurrenciesModule,
    SupplierInvoiceModule
    
  ],
  controllers: [LoanLongTermController],
  providers: [LoanLongTermService],
  exports: [LoanLongTermService],
})
export class LoanLongTermModule {}
