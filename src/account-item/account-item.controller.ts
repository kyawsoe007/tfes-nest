import { AccountItem } from './account-item.interface';
import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountItemService } from './account-item.service';
import { CreateAccountItemDto } from './dto/create-account-item.dto';
import { UpdateAccountItemDto } from './dto/update-account-item.dto';
import { FilterDto } from 'src/shared/filter.dto';

@ApiTags('account-item')
@Controller('account-item')
export class AccountItemController {
  constructor(private readonly accountItemService: AccountItemService) {}

  @Post()
  create(@Body() createAccountItemDto: CreateAccountItemDto) {
    return this.accountItemService.create(createAccountItemDto);
  }

  /*
  @Get()
  async findAll(): Promise<AccountItem[]> {
    const result=await this.accountItemService.findAll();
    return result;
  }
  */

  @Post('getfilters')
  findAll(@Body() query: FilterDto){
    return this.accountItemService.getfilters(query);
  }

  @Get('dropdown-currency')
  async getAllCurrencyDropdown() {
    const result = await this.accountItemService.getAllCurrencyDropdown();
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountItemService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAccountItemDto: UpdateAccountItemDto) {
    return this.accountItemService.update(id, updateAccountItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountItemService.remove(id);
  }
}
