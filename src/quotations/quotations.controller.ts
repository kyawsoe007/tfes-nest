import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  Patch,
  InternalServerErrorException,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { Quotation } from './quotation.interface';
import { FilterDto } from '../shared/filter.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/users.interface';

import { Response } from 'express';

import fs = require('fs-extra');
import path = require('path');
import ejs = require('ejs');
import pdf = require('html-pdf');
import {printPdfOptions} from '../shared/printPdfOptions';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';

@ApiTags('Quotation')
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  // Create new Quotation
  @Post()
  async create(@Body() createQuotationDto: CreateQuotationDto) {
    return await this.quotationsService.create(createQuotationDto);
  }

  // Update old and Create New Version of Quotation
  @Post('/create-new-version/:id')
  async createNewVersion(@Param('id') id: string) {
    // Find Status
    const quotation = await this.quotationsService.findStatusById(id);

    if (!quotation) {
      throw new InternalServerErrorException(
        'Failed to update Original Version!',
      );
    }

    // Create New Version of Quotation
    const newQuotation = await this.quotationsService.createNewVersionQuotation(
      quotation,
    );

    if (!newQuotation) {
      throw new InternalServerErrorException(
        'Failed to create new version of quotation',
      );
    }

    // Update Old Version
    await this.quotationsService.updateQuotationStatus(id);

    // Return New Quotation
    return newQuotation;
  }

  @Get()
  async findAll() {
    const result = await this.quotationsService.findAll();
    return result;
  }

  @Get('findStatusById/:id')
  async findStatusById(@Param('id') id: string): Promise<Quotation> {
    return await this.quotationsService.findStatusById(id);
  }

  @Post('getfilters')
  async getfilters(@Body() query: FilterDto, @AuthUser() user: User) {
    const result = await this.quotationsService.getfilters(query, user);
    return result;
  }

  // Fetch all dropdown group belongs to quotation page
  @Get('dropdown-group')
  async getAllQuotationDropdownGroup() {
    const result = await this.quotationsService.getAllQuotationDropdownGroup();
    return result;
  }

  @Get(':id')
  async findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<Quotation> {
    const result = await this.quotationsService.findOne(id);
    if (!result) {
      throw new NotFoundException('Quotation not found!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
  ): Promise<Quotation> {
    const updatedQuotation = await this.quotationsService.update(
      id,
      updateQuotationDto,
    );

    if (!updatedQuotation) {
      throw new InternalServerErrorException('Quotation Failed to update!');
    }
    return updatedQuotation;
  }

  // need to change
  @Patch('/update-quotation-convert-status/:id')
  async updateConvertStatus(
    quotationId: string,
    salesOrderId: string,
    soStatus: string,
    isMode: string,
  ) {
    return await this.quotationsService.updateConvertStatus(
      quotationId,
      salesOrderId,
      soStatus,
      isMode,
    );
  }

  @Patch('/update-so-detail/:id')
  async updateSoDetail(
    quotationId: string,
    soNumber: string,
    soStatus: string,
  ) {
    return await this.quotationsService.updateSoDetail(
      quotationId,
      soNumber,
      soStatus,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<any> {
    return this.quotationsService.remove(id);
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=quotation.pdf')
  @Get('/pdf/:id')
  async generatePdf(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    // const quotation = await this.quotationsService.findStatusById(id);
    const quotation = await this.quotationsService.generatePdf(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/quotations/templates', 'quotation.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      data: quotation,
    });
    const options = printPdfOptions();
    pdf.create(render, options).toStream((err: any, stream: any) => {
      if (err) {
        console.error(err);
        response.status(500);
        response.end(JSON.stringify(err));

        return;
      }
      response.setHeader('Content-type', 'application/pdf');
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=quotation.pdf',
      );

      stream.pipe(response);
    });
  }
}
