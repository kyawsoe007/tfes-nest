import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { CapexManagementService } from './capex-management.service';
import { CapexManagementController } from './capex-management.controller';
import { CapexManagementSchema } from './schemas/capex-management.schema';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';
import { AccountItemModule } from 'src/account-item/account-item.module';
import { SupplierInvoiceModule } from 'src/supplier-invoice/supplier-invoice.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    MongooseModule.forFeature([
      {name:'CapexManagement',schema:CapexManagementSchema},
    ]),
    JournalEntryModule,
    AccountItemModule,
    SupplierInvoiceModule,
    ScheduleModule.forRoot()
  ],
  
  controllers: [CapexManagementController],
  providers: [CapexManagementService],
  exports:[CapexManagementService]
})
export class CapexManagementModule {}
