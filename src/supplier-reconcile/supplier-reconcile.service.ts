
import {
  ForbiddenException, forwardRef,
  HttpException, Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose'; // Added new Line

import { Model } from 'mongoose'; // Added new line
import { CreateSupplierReconcileDto } from './dto/create-supplier-reconcile.dto';
import { UpdateSupplierReconcileDto } from './dto/update-supplier-reconcile.dto';
import { PaymentService } from 'src/payment/payment.service';
import { SupplierInvoiceService } from 'src/supplier-invoice/supplier-invoice.service';
import { SupplierReconcile } from './interfaces/supplier-reconcile.interface';
import { DebitNoteService } from 'src/debit-note/debit-note.service';
import { PaymentDepositService } from 'src/payment-deposits/payment-deposit.service';
@Injectable()
// List of methods of queries to access to database with Respository
export class SupplierReconcileService {
  // added constructor
  constructor(
    @InjectModel('SupplierReconcile')
    private readonly supplierreconcileModel: Model<SupplierReconcile>,
    @Inject(forwardRef(() => SupplierInvoiceService))
    private readonly invoicesService: SupplierInvoiceService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => DebitNoteService))
    private readonly debitNoteService: DebitNoteService,
    @Inject(forwardRef(() => PaymentDepositService))
    private readonly paymentDepositService: PaymentDepositService,
  ) {}

  // Create New reconcile
  async createNewReconcile(
    createSupplierReconcileDto: CreateSupplierReconcileDto
  ): Promise<SupplierReconcile> {
    const newReconcile = new this.supplierreconcileModel(createSupplierReconcileDto);
    console.log('new',newReconcile)
    const createdReconcile = await newReconcile.save();

    return this.supplierreconcileModel.findOne({ _id: createdReconcile._id });
  }

  async getOutstands(id: string): Promise<any> {
    const response = await this.supplierreconcileModel.find({
      reconciled: false,
      suppId: id,
      modelName: 'supplierinvoice',
      reconcileId: undefined,
    });

    await Promise.all(response.map(async inv => {
      let invoice = await this.invoicesService.findOne(inv.modelId);
      inv.set("currency", invoice.currency, { strict: false });
      inv.set("soNumber", invoice.soNumber, { strict: false });
    }));

    const debits = await this.supplierreconcileModel.find({
      reconciled: false,
      suppId: id, 
      modelName: 'debit-note',
      reconcileId: undefined
    })

    const deposits = await this.supplierreconcileModel.find({
      reconciled: false,
      suppId: id, 
      modelName: 'supplier-deposit',
      reconcileId: undefined
    })
    

    await Promise.all(debits.map(async inv => {
      try {
        let invoice = await this.debitNoteService.findOne(inv.modelId);
        inv.set("currency", invoice.currency, { strict: false });
      }
      catch(err){
        console.log("supplier reconcile inv does not exist");
      }
      
    }));

    await Promise.all(deposits.map(async inv => {
      try {
        let invoice = await this.paymentDepositService.findOne(inv.modelId);
      inv.set("currency", invoice.currency, { strict: false });  
      }
      catch(err){
        console.log("supplier reconcile deposit does not exist");
      }    
    }));

    const combinedDebit = debits.concat(deposits);

    response.sort((a, b) => {
      let a1 = <SupplierReconcile>a;
      let b1 = <SupplierReconcile>b;
      if(a1.invoiceNumber < b1.invoiceNumber) return -1;
      else if(a1.invoiceNumber > b1.invoiceNumber) return 1;
      else return 0;
    });

    combinedDebit.sort((a, b) => {
      let a1 = <SupplierReconcile>a;
      let b1 = <SupplierReconcile>b;
      if(a1.invoiceNumber < b1.invoiceNumber) return -1;
      else if(a1.invoiceNumber > b1.invoiceNumber) return 1;
      else return 0;
    })

    const result = {
      invoices: response ? response: [],
      debitNotes: combinedDebit ? combinedDebit: []
    }
    return result;
  }

  async getPaymentReconciles(id: string, type: string): Promise<SupplierReconcile[]> {
      let paymentReconcile = await this.supplierreconcileModel.findOne({ modelId: id});
      if(paymentReconcile){
          const response = await this.supplierreconcileModel.find({
            reconcileId: paymentReconcile._id,
            modelName: type
        });
        return response;
      }

      return [];
  }

  async getSupplierReconcileBalance(id:string){
    let balance=0;
    let paymentReconcile = await this.supplierreconcileModel.find({ modelId: id,reconciled:false, reconcileId: { $exists: false }});
  paymentReconcile.map(async (i)=>{
    balance+=i.credit-i.debit
  })
    return balance
  }

  /*
  async updateReconcile(
      updateSupplierReconcileDto: UpdateSupplierReconcileDto
  ): Promise<any> {
      if (updateSupplierReconcileDto.allocation == (updateSupplierReconcileDto.debit - updateSupplierReconcileDto.credit)) {
        let newReconcile = new this.supplierreconcileModel(updateSupplierReconcileDto);
        await newReconcile.save();
      } else if (updateSupplierReconcileDto.allocation != 0) {
          let newReconcile = new this.supplierreconcileModel({
              ...updateSupplierReconcileDto,
              debit: updateSupplierReconcileDto.debit,
              credit: (updateSupplierReconcileDto.credit + updateSupplierReconcileDto.allocation),
              allocation: updateSupplierReconcileDto.allocation,
              reconciled: updateSupplierReconcileDto.reconciled,
          });
          await newReconcile.save();

            let data = {
                credit: (updateSupplierReconcileDto.credit + updateSupplierReconcileDto.allocation),
                debit: updateSupplierReconcileDto.debit,
                modelName: updateSupplierReconcileDto.modelName,
                modelId: updateSupplierReconcileDto.modelId,
                invoiceNumber: updateSupplierReconcileDto.invoiceNumber,
                suppId: updateSupplierReconcileDto.suppId,
                reconciled: false,
                reconcileId: undefined,
                allocation: 0,
                origin: true,
                id: undefined
            };

            this.createNewReconcile(data);
      }
  }

  async updateDebit(
    updateReconcileDto: UpdateSupplierReconcileDto
): Promise<any> {
    if (updateReconcileDto.allocation == (updateReconcileDto.credit - updateReconcileDto.debit) && updateReconcileDto.allocation != 0) {
      updateReconcileDto.debit = updateReconcileDto.debit + updateReconcileDto.allocation;  
      let newReconcile = new this.supplierreconcileModel(updateReconcileDto);
        await newReconcile.save();
    } else if (updateReconcileDto.allocation != 0) {
        let newReconcile = new this.supplierreconcileModel({
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
            suppId: updateReconcileDto.suppId,
            reconciled: false,
            reconcileId: undefined,
            allocation: 0,
            origin: true,
            id: undefined
        };

        this.createNewReconcile(data);
    }
}

  async removeReconcileByCust(custId: string): Promise<any> {
        const reconciles = await this.supplierreconcileModel.find({custId: custId});

        reconciles.forEach(reconcile => {
            this.supplierreconcileModel.findByIdAndRemove({
                _id: reconcile._id,
            });
        });
  }

  async deleteOriginalInvoices(args: any): Promise<any> {
        const result = await this.supplierreconcileModel.findOneAndRemove({
            modelId: args.modelId,
            custId: args.custId,
            origin: true
        });
        return result;
  }

  async findReconciles(id: string): Promise<SupplierReconcile[]> {
      return this.supplierreconcileModel.find({modelId: id, modelName: 'supplierinvoice'});
  }

  async findOneReconciles(id:string):Promise<SupplierReconcile>{
    return await this.supplierreconcileModel.findOne({modelId:id})
  }

  async updateReconcileOne(id:string,updateReconcile:any):Promise<SupplierReconcile>{
    return await this.supplierreconcileModel.findByIdAndUpdate(id,updateReconcile,{new:true})
  }

  async findDebitNotes(id: string): Promise<SupplierReconcile[]> {
    return this.supplierreconcileModel.find({modelId: id, modelName: 'debit-note'});
  }

  async findDeposits(id: string): Promise<SupplierReconcile[]> {
    return this.supplierreconcileModel.find({modelId: id, modelName: 'supplier-deposit'});
  }
  */
}
