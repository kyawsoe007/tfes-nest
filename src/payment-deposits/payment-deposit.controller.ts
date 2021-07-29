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
  import { PaymentDepositService } from './payment-deposit.service';
  import { CreatePaymentDepositDto } from './dto/create-payment-deposit.dto';
  import { UpdatePaymentDepositDto } from './dto/update-payment-deposit.dto';
  import { PaymentDeposit } from './interfaces/payment-deposit.interface';
  import { FilterDto } from 'src/shared/filter.dto';
  import { ValidateObjectId } from 'src/shared/validate-object-id.pipes';
  import { Response } from 'express';
  
  import pdf = require('html-pdf');
  import ejs = require('ejs');
  import path = require('path');
  import fs = require('fs-extra');
  import {printPdfOptions} from '../shared/printPdfOptions';
  @ApiTags('PaymentDeposit')
  @Controller('payment-deposit')
  export class PaymentDepositController {
    constructor(private paymentDepositService: PaymentDepositService) {}
  
    // Create new credit-note
    @Post()
    async createNewDebitNote(
      @Body() CreatePaymentDepositDto: CreatePaymentDepositDto
    ): Promise<PaymentDeposit> {
      return await this.paymentDepositService.createNewPaymentDeposit(
        CreatePaymentDepositDto
      );
    }
  
    // Fill All CreditNotes
    @Get('all')
    async findAll() {
      const result = await this.paymentDepositService.findAll();
      
      return result;
    }
  
    // Find All + Filtered
    @Post('getfilters')
    async getfilters(@Body() query: FilterDto) {
      const result = await this.paymentDepositService.getfilters(query);
      return result;
    }
  
  
    // Find Single credit-note
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<PaymentDeposit> {
      const result = await this.paymentDepositService.findOne(id);
      if (!result) {
        console.log('payment-deposit not found');
        throw new NotFoundException('payment-deposit not found!');
      }
      return result;
    }
  
    // Update Single credit-note
    @Patch(':id')
    async update(
      @Param('id') id: string,
      @Body() updateCreditNoteDto: UpdatePaymentDepositDto
    ) {
      const updatedCreditNote = await this.paymentDepositService.update(
        id,
          updateCreditNoteDto
      );
  
      if (!updatedCreditNote) {
        throw new InternalServerErrorException('payment-deposit failed to update!');
      }
      return updatedCreditNote;
    }
  
    // Delete Single credit-note
    @Delete(':id')
    remove(@Param('id') id: string): Promise<any> {
      return this.paymentDepositService.removeOne(id);
    }
  
    @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=debitNote.pdf')
  @Get('/payment-deposit-print-Pdf/:id')
  async getTaxInvoicePdf(
    @Param('id', new ValidateObjectId()) id: string,
    @Res() response: Response,
  ) {
    const creditNotePayload = await this.paymentDepositService.getPaymentDepositPDF(id);

    const layoutHtml = fs.readFileSync(
      path.resolve('./src/payment-deposit/template', 'debitNote.ejs'),
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
  