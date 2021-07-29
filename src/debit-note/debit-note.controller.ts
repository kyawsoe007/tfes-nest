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
  import { DebitNoteService } from './debit-note.service';
  import { CreateDebitNoteDto } from './dto/create-debit-note.dto';
  import { UpdateDebitNoteDto } from './dto/update-debit-note.dto';
  import { DebitNote } from './interfaces/debit-note.interface';
  import { FilterDto } from 'src/shared/filter.dto';
  import { ValidateObjectId } from 'src/shared/validate-object-id.pipes';
  import { Response } from 'express';
  
  import pdf = require('html-pdf');
  import ejs = require('ejs');
  import path = require('path');
  import fs = require('fs-extra');
  import {printPdfOptions} from '../shared/printPdfOptions';
  @ApiTags('DebitNote')
  @Controller('debit-note')
  export class DebitNoteController {
    constructor(private debitNoteService: DebitNoteService) {}
  
    // Create new credit-note
    @Post()
    async createNewDebitNote(
      @Body() createDebitNoteDto: CreateDebitNoteDto
    ): Promise<DebitNote> {
      return await this.debitNoteService.createNewDebitNote(
        createDebitNoteDto
      );
    }
  
    // Fill All CreditNotes
    @Get('all')
    async findAll() {
      const result = await this.debitNoteService.findAll();
      
      return result;
    }
  
    // Find All + Filtered
    @Post('getfilters')
    async getfilters(@Body() query: FilterDto) {
      const result = await this.debitNoteService.getfilters(query);
      return result;
    }
  
  
    // Find Single credit-note
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<DebitNote> {
      const result = await this.debitNoteService.findOne(id);
      if (!result) {
        console.log('debit-note not found');
        throw new NotFoundException('debit-note not found!');
      }
      return result;
    }
  
    // Update Single credit-note
    @Patch(':id')
    async update(
      @Param('id') id: string,
      @Body() updateCreditNoteDto: UpdateDebitNoteDto
    ) {
      const updatedCreditNote = await this.debitNoteService.update(
        id,
          updateCreditNoteDto
      );
  
      if (!updatedCreditNote) {
        throw new InternalServerErrorException('debit-note failed to update!');
      }
      return updatedCreditNote;
    }
  
    // Delete Single credit-note
    @Delete(':id')
    remove(@Param('id') id: string): Promise<any> {
      return this.debitNoteService.removeOne(id);
    }
  
    @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=debitNote.pdf')
  @Get('/debit-note-print-Pdf/:id')
  async getTaxInvoicePdf(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ) {
    const creditNotePayload = await this.debitNoteService.getDebitNotePDF(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/debit-note/template', 'debitNote.ejs'),
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
  