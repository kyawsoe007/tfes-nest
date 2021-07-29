import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PurchaseSettingService } from './purchase-setting.service';
import { CreatePurchaseSettingDto } from './dto/create-purchase-setting.dto';
import { UpdatePurchaseSettingDto } from './dto/update-purchase-setting.dto';
import { PurchaseSetting } from './purchase-setting.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Purchase-Setting')
@Controller('purchase-setting')
export class PurchaseSettingController {
  constructor(private readonly purchaseSettingService: PurchaseSettingService) {}

  @Post()
  create(@Body() createPurchaseSettingDto: CreatePurchaseSettingDto):Promise<PurchaseSetting> {
    return this.purchaseSettingService.create(createPurchaseSettingDto);
  }

  @Get()
  findAll():Promise<PurchaseSetting[]> {
    return this.purchaseSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string):Promise<PurchaseSetting> {
    return this.purchaseSettingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePurchaseSettingDto: UpdatePurchaseSettingDto):Promise<PurchaseSetting> {
    return this.purchaseSettingService.update(id, updatePurchaseSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string):Promise<void> {
    return this.purchaseSettingService.remove(id);
  }
}
