import {
  ForbiddenException, forwardRef,
  HttpException, Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose'; // Added new Line

import { Model } from 'mongoose'; // Added new line
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { CreateReconcileDto } from './dto/create-reconcile.dto';
import { UpdateReconcileDto } from './dto/update-reconcile.dto';
import { InvoicesService } from 'src/invoices/invoices.service';
import { SupplierInvoiceService } from 'src/supplier-invoice/supplier-invoice.service';
import { PaymentService } from 'src/payment/payment.service';
import {Reconcile} from "./interfaces/reconcile.interface";
import { CreditNoteService } from 'src/credit-note/credit-note.service';
import { DebitNoteService } from 'src/debit-note/debit-note.service';
import {Invoice} from "../invoices/interfaces/invoices.interface";
import { PaymentDepositService } from 'src/payment-deposits/payment-deposit.service';

@Injectable()
// List of methods of queries to access to database with Respository
export class ReconcileService {
  // added constructor
  constructor(
    @InjectModel('Reconcile')
    private readonly reconcileModel: Model<Reconcile>,
    @Inject(forwardRef(() => InvoicesService))
    private readonly invoicesService: InvoicesService,
    @Inject(forwardRef(() => SupplierInvoiceService))
    private readonly supplierInvoiceService: SupplierInvoiceService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => CreditNoteService))
    private readonly creditNoteService: CreditNoteService,
    @Inject(forwardRef(() => DebitNoteService))
    private readonly debitNoteService: DebitNoteService,
    @Inject(forwardRef(() => PaymentDepositService))
    private readonly paymentDepositService: PaymentDepositService,
    private readonly sequenceSettingsService: SequenceSettingsService,
  ) {}

  // Create New reconcile
  async createNewReconcile(
    createReconcileDto: CreateReconcileDto
  ): Promise<Reconcile> {
    const settingsFound = await this.sequenceSettingsService.FindSequenceByModelName(
      "Reconcile",
    );
    if (!settingsFound) {
      throw new InternalServerErrorException('Model name does not exist!');
    }
    const newSequenceValue = this.sequenceSettingsService.sequenceSettingEx(
      settingsFound,
    );

    if (settingsFound) {
      //const newNextNumber = nextNumber + 1;
      const updatedSequence = await this.sequenceSettingsService.updateSequenceByModelName(
        "Reconcile",
        settingsFound,
      );
      if (!updatedSequence) {
        throw new InternalServerErrorException(
          'Sequence Setting Failed to update!',
        );
      }
    }
    createReconcileDto.number = newSequenceValue;
    const newReconcile = new this.reconcileModel(createReconcileDto);
    const createdReconcile = await newReconcile.save();

    return this.reconcileModel.findOne({ _id: createdReconcile._id });
  }

  async updateReconcileClosed(params: any): Promise<any> {
      const id = params.modelId;
      const custId = params.custId;

      await this.reconcileModel.findOneAndUpdate(
        {
                  modelId: id,
                  custId: custId,
                  modelName: 'credit-note',
                  reconciled: false
              },
      { reconciled: true },
      { new: true },
      );
  }

  async getOutstands(id: string): Promise<any> {
    /*
      const invoices = await this.reconcileModel.find({
        reconciled: false,
        custId: id,
        modelName: 'invoice',
        reconcileId: undefined,
      });
      */
     const invoices  = await this.reconcileModel.find({
      reconciled: false,
      custId: id,
      reconcileId: undefined,
      debit: { $gt: 0}
     })
     let allinvoices = [];
     let allcredits = [];
      await Promise.all(invoices.map(async inv => {
        //check the model name
        switch(inv.modelName){
          case "invoice":
            let invoice = await this.invoicesService.findOne(inv.modelId);
            inv.set("currency", invoice.currency, { strict: false });
            allinvoices.push(inv);
            break;
          case "debit-note":
            let debit = await this.debitNoteService.findOne(inv.modelId);
            inv.set("currency", debit.currency, { strict: false});
            allinvoices.push(inv);
            break;
          case "supplier-deposit":
            let deposit = await this.paymentDepositService.findOne(inv.modelId);
            inv.set("currency", deposit.currency, { strict: false});
            allinvoices.push(inv);
            break;
          
        }
        
      }));
      /*
      const credits = await this.reconcileModel.find({
          reconciled: false,
          custId: id,
          modelName: 'credit-note',
          reconcileId: undefined,
      });


      const deposits = await this.reconcileModel.find({
        reconciled: false,
        custId: id, 
        modelName: 'customer-deposit',
        reconcileId: undefined
      })
      */
      const credits = await this.reconcileModel.find({
        reconciled: false,
        custId: id,
        credit: { $gt: 0},
        reconcileId: undefined,
    });

      await Promise.all(credits.map(async cred => {
        switch(cred.modelName){ 
          case "credit-note":
            let credit = await this.creditNoteService.findOne(cred.modelId);
            cred.set("currency", credit.currency, { strict: false });
            allcredits.push(cred);
            break;
          case "supplierinvoice":
            let suppinv = await this.supplierInvoiceService.findOne(cred.modelId);
            cred.set("currency", suppinv.currency, { strict: false });
            allcredits.push(cred);
            break;
          case "customer-deposit":
            let deposit = await this.paymentDepositService.findOne(cred.modelId);
            cred.set("currency", deposit.currency, { strict: false});
            allcredits.push(cred);
            break;
        }
        
      }));
      
      

      allinvoices.sort((a, b) => {
        let a1 = <Reconcile>a;
        let b1 = <Reconcile>b;
        if(a1.invoiceNumber < b1.invoiceNumber) return -1;
        else if(a1.invoiceNumber > b1.invoiceNumber) return 1;
        else return 0;
      });

      allcredits.sort((a, b) => {
        let a1 = <Reconcile>a;
        let b1 = <Reconcile>b;
        if(a1.invoiceNumber < b1.invoiceNumber) return -1;
        else if(a1.invoiceNumber > b1.invoiceNumber) return 1;
        else return 0;
      })

      const result = {
          invoices: allinvoices,
          creditNotes: allcredits
      };

      return result;
  }

  async getSupplierOutstands(id: string): Promise<any> {
    const invoices  = await this.reconcileModel.find({
      reconciled: false,
      custId: id,
      reconcileId: undefined,
      credit: { $gt: 0}
     })

     let allinvoices = [];
     let alldebits = [];
      await Promise.all(invoices.map(async inv => {
        //check the model name
        switch(inv.modelName){
          case "supplierinvoice":
            let invoice = await this.supplierInvoiceService.findOne(inv.modelId);
            inv.set("currency", invoice.currency, { strict: false });
            inv.set("soNumber", invoice.soNumber, { strict: false });
            allinvoices.push(inv);
            break;
          case "credit-note":
            let debit = await this.creditNoteService.findOne(inv.modelId);
            inv.set("currency", debit.currency, { strict: false});
            allinvoices.push(inv);
            break;
          case "customer-deposit":
            let deposit = await this.paymentDepositService.findOne(inv.modelId);
            inv.set("currency", deposit.currency, { strict: false});
            allinvoices.push(inv);
            break;
          
        }
        
      }));

      const debits = await this.reconcileModel.find({
        reconciled: false,
        custId: id,
        debit: { $gt: 0},
        reconcileId: undefined,
    });


    await Promise.all(debits.map(async inv => {
      //check the model name
      switch(inv.modelName){
        case "invoice":
          let invoice = await this.invoicesService.findOne(inv.modelId);
          inv.set("currency", invoice.currency, { strict: false });          
          alldebits.push(inv);
          break;
        case "debit-note":
          let debit = await this.debitNoteService.findOne(inv.modelId);          
          inv.set("currency", debit.currency, { strict: false});
          alldebits.push(inv);
          break;
        case "supplier-deposit":
          let deposit = await this.paymentDepositService.findOne(inv.modelId);
          inv.set("currency", deposit.currency, { strict: false});
          alldebits.push(inv);
          break;
        
      }
      
    }));

      

    allinvoices.sort((a, b) => {
      let a1 = <Reconcile>a;
      let b1 = <Reconcile>b;
      if(a1.invoiceNumber < b1.invoiceNumber) return -1;
      else if(a1.invoiceNumber > b1.invoiceNumber) return 1;
      else return 0;
    });

    alldebits.sort((a, b) => {
      let a1 = <Reconcile>a;
      let b1 = <Reconcile>b;
      if(a1.invoiceNumber < b1.invoiceNumber) return -1;
      else if(a1.invoiceNumber > b1.invoiceNumber) return 1;
      else return 0;
    })
    console.log(allinvoices);
    const result = {
      invoices: allinvoices,
      debitNotes: alldebits
    }
    //console.log(result);
    return result;
  }

  async getPaymentReconciles(id: string): Promise<Reconcile[]> {
     let paymentReconcile = await this.reconcileModel.findOne({ modelId: id});
     if(paymentReconcile){
        const response = await this.reconcileModel.find({
          reconcileId: paymentReconcile._id        
      });
      
      
      return response;
     }
    return [];
  }

  async getReconcileBalance(id:string){
    let balance=0;
    let paymentReconcile = await this.reconcileModel.find({ modelId: id,reconciled:false, reconcileId: {$exists: false }});
  paymentReconcile.map(async (i)=>{
    balance+=i.credit-i.debit
  })
    return balance
  }

  async getSupplierReconcileBalance(id:string){
    let balance=0;
    let paymentReconcile = await this.reconcileModel.find({ modelId: id,reconciled:false, reconcileId: {$exists: false }});
  paymentReconcile.map(async (i)=>{
    balance+=i.debit-i.credit
  })
    return balance
  }

  async updateReconcile(
      updateReconcileDto: UpdateReconcileDto
  ): Promise<any> {
      if ((updateReconcileDto.allocation == (updateReconcileDto.debit - updateReconcileDto.credit) && updateReconcileDto.allocation != 0) || updateReconcileDto.reconciled ) {
        updateReconcileDto.credit = updateReconcileDto.credit + updateReconcileDto.allocation;
        let newReconcile = new this.reconcileModel(updateReconcileDto);
        await newReconcile.save();
      }      
      else if (updateReconcileDto.allocation != 0) {
          let newReconcile = new this.reconcileModel({
              ...updateReconcileDto,
              debit: updateReconcileDto.debit,
              credit: (updateReconcileDto.credit + updateReconcileDto.allocation),
              allocation: updateReconcileDto.allocation,
              reconciled: updateReconcileDto.reconciled,
          });
          await newReconcile.save();

            let data = {
                credit: (updateReconcileDto.credit + updateReconcileDto.allocation),
                debit: updateReconcileDto.debit,
                modelName: updateReconcileDto.modelName,
                modelId: updateReconcileDto.modelId,
                invoiceNumber: updateReconcileDto.invoiceNumber,
                custId: updateReconcileDto.custId,
                reconciled: false,
                reconcileId: undefined,
                allocation: 0,
                origin: true,
                id: undefined
            };

            await this.createNewReconcile(data);
      }
  }

  async updateReconcileInvoice(id:string,updateReconcileDto:UpdateReconcileDto):Promise<any>{
    await this.reconcileModel.findByIdAndUpdate(id,updateReconcileDto,{new:true})
  }

    async updateCredit(
        updateReconcileDto: UpdateReconcileDto
    ): Promise<any> {
        if ((updateReconcileDto.allocation == (updateReconcileDto.credit - updateReconcileDto.debit) && updateReconcileDto.allocation != 0) || updateReconcileDto.reconciled) {
          updateReconcileDto.debit = updateReconcileDto.debit + updateReconcileDto.allocation;  
          let newReconcile = new this.reconcileModel(updateReconcileDto);
            await newReconcile.save();
        } else if (updateReconcileDto.allocation != 0) {
            let newReconcile = new this.reconcileModel({
                ...updateReconcileDto,
                debit: updateReconcileDto.debit + updateReconcileDto.allocation,
                credit: updateReconcileDto.credit,
                allocation: updateReconcileDto.allocation,
                reconciled: updateReconcileDto.reconciled,
            });
            await newReconcile.save();

            let data = {
                credit: updateReconcileDto.credit,
                debit: updateReconcileDto.debit + updateReconcileDto.allocation,
                modelName: updateReconcileDto.modelName,
                modelId: updateReconcileDto.modelId,
                invoiceNumber: updateReconcileDto.invoiceNumber,
                custId: updateReconcileDto.custId,
                reconciled: false,
                reconcileId: undefined,
                allocation: 0,
                origin: true,
                id: undefined
            };

            await this.createNewReconcile(data);
        }
    }

  async removeReconcileByCust(custId: string): Promise<any> {
        const reconciles = await this.reconcileModel.find({custId: custId});

        reconciles.forEach(reconcile => {
            this.reconcileModel.findByIdAndRemove({
                _id: reconcile._id,
            });
        });
  }

  async deleteOriginalInvoices(args: any): Promise<any> {
    console.log(args);
        const result = await this.reconcileModel.findOneAndRemove({
            modelId: args.modelId,
            custId: args.custId,
            origin: true
        });
        return result;
  }

  async findOneReconcile(id:string):Promise<Reconcile>{
    return await this.reconcileModel.findOne({modelId:id})
  }

  async findReconciles(id: string): Promise<Reconcile[]> {
      return this.reconcileModel.find({modelId: id} );
  }

  /*
  async findCreditNotes(id: string): Promise<Reconcile[]> {
      return this.reconcileModel.find({modelId: id, modelName: 'credit-note'});
  }

  async findDeposits(id: string): Promise<Reconcile[]> {
    return this.reconcileModel.find({modelId: id, modelName: 'customer-deposit'});
  }
  */
}
