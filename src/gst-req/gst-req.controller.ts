import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { GstReqService } from './gst-req.service';
import { CreateGstReqDto } from './dto/create-gst-req.dto';
import { UpdateGstReqDto } from './dto/update-gst-req.dto';

@ApiTags('Gst-reg')
@Controller('gst-req')
export class GstReqController {
  constructor(private readonly gstReqService: GstReqService) {}

  @Post()
  create(@Body() createGstReqDto: CreateGstReqDto) {
    return this.gstReqService.create(createGstReqDto);
  }

  @Get()
  findAll() {
    return this.gstReqService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gstReqService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGstReqDto: UpdateGstReqDto) {
    return this.gstReqService.update(id, updateGstReqDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gstReqService.remove(id);
  }
}
