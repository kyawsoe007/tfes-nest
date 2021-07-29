import { Module,forwardRef } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { JournalEntryModule } from 'src/journal-entry/journal-entry.module';

@Module({
  imports:[JournalEntryModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports:[ReportsService]
})
export class ReportsModule {}
