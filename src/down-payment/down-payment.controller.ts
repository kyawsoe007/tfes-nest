import { DownPayment } from 'src/down-payment/down-payment.interface';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { DownPaymentService } from './down-payment.service';
import { CreateDownPaymentDto } from './dto/create-down-payment.dto';
import { UpdateDownPaymentDto } from './dto/update-down-payment.dto';
@ApiTags('Down-payment')
@Controller('down-payment')
export class DownPaymentController {
  constructor(private readonly downPaymentService: DownPaymentService) {}

  @Post()
  create(@Body() createDownPaymentDto: CreateDownPaymentDto) {
    return this.downPaymentService.create(createDownPaymentDto);
  }

  @Get()
  findAll() {
    return this.downPaymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.downPaymentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDownPaymentDto: UpdateDownPaymentDto,
  ):Promise<DownPayment> {
    return this.downPaymentService.update(id, updateDownPaymentDto);
  }
  @Delete(':id')
  remove(@Param('id') id: string):Promise<void> {
    return this.downPaymentService.remove(id);
  }
}
