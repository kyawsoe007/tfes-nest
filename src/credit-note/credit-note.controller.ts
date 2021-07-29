import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  InternalServerErrorException,
  Header,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreditNoteService } from './credit-note.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { UpdateCreditNoteDto } from './dto/update-credit-note.dto';
import { CreditNote } from './interfaces/credit-note.interface';
import { FilterDto } from 'src/shared/filter.dto';
import { ValidateObjectId } from 'src/shared/validate-object-id.pipes';
import { Response } from 'express';

import pdf = require('html-pdf');
import ejs = require('ejs');
import path = require('path');
import fs = require('fs-extra');
import {printPdfOptions} from '../shared/printPdfOptions';
@ApiTags('CreditNote')
@Controller('credit-note')
export class CreditNoteController {
  constructor(private creditNoteService: CreditNoteService) {}

  // Create new credit-note
  @Post()
  async createNewCreditNote(
    @Body() createCreditNoteDto: CreateCreditNoteDto
  ): Promise<CreditNote> {
    return await this.creditNoteService.createNewCreditNote(
        createCreditNoteDto
    );
  }

  // Fill All CreditNotes
  @Get('all')
  async findAll() {
    const result = await this.creditNoteService.findAll();

    return result;
  }

  // Find All + Filtered
  @Post('getfilters')
  async getfilters(@Body() query: FilterDto) {
    const result = await this.creditNoteService.getfilters(query);
    return result;
  }

  @Get('/dropdown-group')
  async findAllDrop() {
    const result = await this.creditNoteService.findAllCreditNoteDropdownGroup();
    return result;
  }

  // Find Single credit-note
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CreditNote> {
    const result = await this.creditNoteService.findOne(id);
    if (!result) {
      console.log('credit-note not found');
      throw new NotFoundException('credit-note not found!');
    }
    return result;
  }

  // Update Single credit-note
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCreditNoteDto: UpdateCreditNoteDto
  ) {
    const updatedCreditNote = await this.creditNoteService.update(
      id,
        updateCreditNoteDto
    );

    if (!updatedCreditNote) {
      throw new InternalServerErrorException('credit-note failed to update!');
    }
    return updatedCreditNote;
  }

  // Delete Single credit-note
  @Delete(':id')
  remove(@Param('id') id: string): Promise<any> {
    return this.creditNoteService.removeOne(id);
  }

  async getSalesOrder(id: string): Promise<CreditNote> {
    const result = this.creditNoteService.getCreditNote(id);
    if (!result) {
      throw new NotFoundException('credit-note not found!!');
    }
    return result;
  }

  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=creditNote.pdf')
  @Get('/credit-note-print-Pdf/:id')
  async getTaxInvoicePdf(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ) {
    const creditNotePayload = await this.creditNoteService.getCreditNotePDF(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/credit-note/template', 'creditNote.ejs'),
      'utf8',
    );
    const render = ejs.render(layoutHtml, {
      creditNote: creditNotePayload,
    });

    const options = printPdfOptions();


    pdf.create(render, options).toStream((err: any, stream: any) => {
      if (err) {
        console.error(err);
        response.status(500);
        response.end(JSON.stringify(err));

        return;
      }
      stream.pipe(response);
    });
  }
}
