import { AccountJournal } from './account-journal.interface';
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountJournalService } from './account-journal.service';
import { CreateAccountJournalDto } from './dto/create-account-journal.dto';
import { UpdateAccountJournalDto } from './dto/update-account-journal.dto';

@ApiTags('account-journal')
@Controller('account-journal')
export class AccountJournalController {
  constructor(private readonly accountJournalService: AccountJournalService) {}

  @Post()
  create(@Body() createJournalItemDto: CreateAccountJournalDto) {
    return this.accountJournalService.create(createJournalItemDto);
  }

  @Get()
  async findAll(): Promise<AccountJournal[]> {
    const result=await this.accountJournalService.findAll();
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountJournalService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJournalItemDto: UpdateAccountJournalDto) {
    return this.accountJournalService.update(id, updateJournalItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountJournalService.remove(id);
  }
}
