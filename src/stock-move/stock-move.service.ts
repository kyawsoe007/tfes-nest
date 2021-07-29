import { Model } from 'mongoose';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateStockMoveDto } from './dto/create-stock-move.dto';
import { StockMove } from './stock-move.interface';
import { PurchasesService } from '../purchase-order/purchase-order.service';
import { SkusService } from '../skus/skus.service';
import { StockOperationService } from '../stock-operation/stock-operation.service';
import { ProductsService } from '../products/products.service';
import { UpdateStockMoveDto } from './dto/update-stock-move.dto';
import {
  CreateStockOperationDto,
  OperationStatusEnumDto,
} from '../stock-operation/dto/create-stock-operation.dto';
import { UpdatePackingListDto } from '../packing-lists/dto/update-packing-list.dto';
import { PackItems } from '../packing-lists/packing-lists.interface';
import { PruchaseStatusEnumDto } from 'src/purchase-order/dto/create-purchase-order.dto';
import { CreateSkusDto } from 'src/skus/dto/create-skus.dto';
import { MoveDto } from './dto/save-stock-move.dto';
import { AccountJournalService } from '../account-journal/account-journal.service';
import { Purchase } from '../purchase-order/purchase-order.interface';
import { PaymentTermsService } from '../payment-terms/payment-terms.service';
import { TaxesService } from '../taxes/taxes.service';
import { CurrenciesService } from '../currencies/currencies.service';
import { Currency, typeOfCurrency } from '../currencies/currencies.interface';
import { AccountItemService } from '../account-item/account-item.service';
import { AccountItem } from '../account-item/account-item.interface';
import { JournalEntryService } from '../journal-entry/journal-entry.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';

@Injectable()
export class StockMoveService {
  constructor(
    @InjectModel('StockMove')
    private readonly stockMoveModel: Model<StockMove>,
    @Inject(forwardRef(() => PurchasesService))
    private purchasesService: PurchasesService,
    @Inject(forwardRef(() => SalesOrdersService))
    private salesordersService: SalesOrdersService,
    @Inject(forwardRef(() => SkusService))
    private readonly skusService: SkusService,
    @Inject(forwardRef(() => StockOperationService))
    private stockOperationService: StockOperationService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    private accountJournalService: AccountJournalService,
    private paymentTermsService: PaymentTermsService,
    private taxesService: TaxesService,
    private currenciesService: CurrenciesService,
    private accountItemService: AccountItemService,
    private journalEntryService: JournalEntryService,
  ) {}

  //create stock move
  async createNewMove(
    createStockMoveDto: CreateStockMoveDto,
  ): Promise<StockMove> {
    const newMove = new this.stockMoveModel(createStockMoveDto);
    console.log('what is newMove', newMove);
    return newMove.save();
  }

  async createNewFromStockOperation(moveDto: MoveDto): Promise<boolean> {
    let index = 0;

    for (const item of moveDto.lines) {
      const payload = {
        operationId: moveDto.operationId,
        destinationId: moveDto.destinationId,
        lineNumber: index++,
        remainingQty: 0,
        qty: item.qty,
        completedQty: item.qty,
        skuId: item.skuId,
        lineNumberId: item.lineId, //delivery line id
        description: item.description,
        productId: item.productId,
        done: true,
      };
      const newMove = new this.stockMoveModel(payload);
      await newMove.save();
    }

    // Call JournalEntry Deduct Stock, This are from Delivery Order

    await this.createJournalEntryOutgoingStock(moveDto);

    return true;
  }

  //get move lines
  async findMoveLines(id: string): Promise<any> {
    const lines = await this.stockMoveModel.find({ operationId: id });

    for (const stockMove of lines) {
      const product = await this.productsService.findOneProductForWO(
        stockMove.productId,
      );
      if (product) {
        console.log(product.partNumber);
        stockMove.set('partNumber', product.partNumber, { strict: false });
      }
    }
    /*
    const removeIds = [];

    for (let i = 0; i < lines.length; i++) {
      //if have parent and not done, don't show parent. instead, set completed qty to sum of all qty
      if (!lines[i].done && lines[i].originalMoveId) {
        let completedAmt = 0;
        for (let j = 0; j < lines.length; j++) {
          if (
            lines[j].id == lines[i].originalMoveId ||
            (lines[j].originalMoveId == lines[i].originalMoveId &&
              lines[j].done)
          ) {
            completedAmt += lines[j].completedQty;
            removeIds.push(lines[j].id);
          }
        }
        lines[i].completedQty = completedAmt;
      }
    }
    const returnLines = lines.filter((item) => !removeIds.includes(item.id));
    */
    return lines;
  }

  //save move lines
  // Incoming Stock- Create entry
  async saveMoveLines(query: any): Promise<any> {
    const date = query.date ? query.date : new Date();
    const lines = query.lines ? query.lines : [];
    const moveNo = query.moveNo ? query.moveNo : '';
    const operationId = query.operationId ? query.operationId : '';
    const operationNo = query.operationNo ? query.operationNo : '';
    let numberOfLines = lines.length;
    let checkStatus = false;
    let checkOperationStatus = true;

    console.log('what is operationId', operationId);

    //remove lines that are already done
    const movelines = await this.stockMoveModel.find({
      operationId: operationId,
    });
    console.log('what is lines', lines);

    const saveLines = [];
    const arrivedQtyLine = [];
    lines.forEach(async (line) => {
      const moveItem = movelines.find((item) => item._id == line.id);
      if (moveItem && moveItem.done) {
      } else {
        saveLines.push(line);
        if (line.qty != line.arrivedQty) {
          checkStatus = true;
        }

        if (line.arrivedQty) {
          arrivedQtyLine.push(line);
        }

        if (line.qty < parseFloat(line.arrivedQty) || !line.done) {
          //check if operation status is completed or incompleted, if false incompleted
          checkOperationStatus = false;
        }
      }
    });

    const operation = await this.stockOperationService.findById(operationId);
    if (operation) {
      const purchaseOrder = await this.purchasesService.findByName(
        operation.orderNo,
      );

      // Create journal Entry Here
      if (arrivedQtyLine && arrivedQtyLine.length > 0) {
        console.log('To Create Journal Entry');
        await this.createJournalEntryIncomingStock(
          arrivedQtyLine,
          purchaseOrder,
        );
      }

      if (!checkStatus) {
        saveLines.map(async (line) => {
          const arrivedQty = parseFloat(line.arrivedQty);
          //get purchase
          const newSkuData: CreateSkusDto = {
            //SKU creation params
            unitCost: line.unitPrice,
            quantity: arrivedQty,
            location: line.destinationId,
            remarks: line.remarks,
            product: line.productId,
          };
          if (purchaseOrder && purchaseOrder.purchaseOrderItems) {
            const currencyRate = purchaseOrder.currencyRate
              ? purchaseOrder.currencyRate
              : 1;
            purchaseOrder.purchaseOrderItems.forEach((element) => {
              if (element._id == line.lineNumberId) {
                if (parseFloat(element.unitPrice) > 0) {
                  newSkuData.unitCost = (element.unitPrice * 1) / currencyRate;
                } else {
                  newSkuData.unitCost = 0;
                }
              }
            });
            newSkuData.supplierNo = purchaseOrder.suppNo;
          }

          await this.stockMoveModel.findByIdAndUpdate(
            { _id: line.id },
            {
              done: line.done,
              completedQty: parseFloat(line.arrivedQty),
              remainingQty: line.remainingQty - parseFloat(line.arrivedQty),
            },
            { new: true },
          );
          await this.skusService.createSku(newSkuData);
          await this.productsService.updateProductCost(line.productId);
        });

        await this.purchasesService.updateStatusErrorCount(
          moveNo,
          PruchaseStatusEnumDto.CLOSED,
        );
        await this.stockOperationService.updateStatus(
          operationId,
          OperationStatusEnumDto.CLOSED,
        );

        // End Here
      } else if (checkStatus) {
        let newStatus = PruchaseStatusEnumDto.PARTIAL;
        for (let i = 0; i < saveLines.length; i++) {
          const line = saveLines[i];
          const remainingQty = line.remainingQty;
          const arrivedQty = parseFloat(line.arrivedQty);

          const newSkuData: CreateSkusDto = {
            //SKU creation params
            unitCost: line.unitPrice,
            quantity: arrivedQty,
            location: line.destinationId,
            remarks: line.remarks,
            product: line.productId,
          };
          if (purchaseOrder && purchaseOrder.purchaseOrderItems) {
            const currencyRate = purchaseOrder.currencyRate
              ? purchaseOrder.currencyRate
              : 1;
            purchaseOrder.purchaseOrderItems.forEach((element) => {
              if (element._id == line.lineNumberId) {
                newSkuData.unitCost = (element.unitPrice * 1) / currencyRate;
              }
            });
            newSkuData.supplierNo = purchaseOrder.suppNo;
          }

          if (arrivedQty > remainingQty && line.done) {
            console.log('arrived more than remaining');
            //purchase order status must be set to "Error count"
            await this.stockMoveModel.findByIdAndUpdate(
              { _id: line.id },
              {
                done: line.done,
                remainingQty: remainingQty - parseFloat(line.arrivedQty),
                completedQty: parseFloat(line.arrivedQty),
              },
              { new: true },
            );
            newStatus = PruchaseStatusEnumDto.ERROR_STATUS;
            await this.skusService.createSku(newSkuData);
          } else if (arrivedQty < remainingQty && line.done) {
            console.log('arrived < remaining');
            //purchase order status must be set to "Error count"
            await this.stockMoveModel.findByIdAndUpdate(
              { _id: line.id },
              {
                done: line.done,
                remainingQty: remainingQty - parseFloat(line.arrivedQty),
                completedQty: parseFloat(line.arrivedQty),
              },
              { new: true },
            );

            newStatus = PruchaseStatusEnumDto.ERROR_STATUS;
          } else if (arrivedQty === remainingQty && line.done) {
            console.log('arrived and remaining equal');
            //move status should be done
            await this.stockMoveModel.findByIdAndUpdate(
              { _id: line.id },
              {
                done: line.done,
                remainingQty: remainingQty - parseFloat(line.arrivedQty),
                completedQty: parseFloat(line.arrivedQty),
              },
              { new: true },
            );
            await this.skusService.createSku(newSkuData);
          } else if (arrivedQty < remainingQty && line.done !== true) {
            //qty = remaining - completed. new stock move created. originalMoveId is first parent move id
            //current move is set as done

            const data = {
              date: date,
              productId: line.productId,
              operationId: operationId,
              lineNumber: line.lineNumber,
              lineNumberId: line._id,
              description: line.description,
              destinationId: line.destinationId,
              skuId: line.skuId,
              qty: line.qty,
              done: false,
              estimatedDate: line.estimatedDate,
              remainingQty: line.remainingQty - parseFloat(line.arrivedQty),
              completedQty: 0,
              originalMoveId: line.id,
            };
            const newMove = new this.stockMoveModel(data);
            await newMove.save();

            numberOfLines = numberOfLines + 1;

            const result = await this.stockMoveModel.findByIdAndUpdate(
              { _id: line.id },
              {
                done: true,
                remainingQty: line.remainingQty - parseFloat(line.arrivedQty),
                completedQty: arrivedQty,
                completedDate: date,
              },
              { new: true },
            );

            const newSkuData: CreateSkusDto = {
              //SKU creation params
              unitCost: result.unitPrice,
              quantity: result.completedQty,
              location: result.destinationId,
              remarks: result.remarks,
              product: result.productId,
            };
            if (purchaseOrder && purchaseOrder.purchaseOrderItems) {
              const currencyRate = purchaseOrder.currencyRate
                ? purchaseOrder.currencyRate
                : 1;
              purchaseOrder.purchaseOrderItems.forEach((element) => {
                if (element._id == line.lineNumberId) {
                  newSkuData.unitCost = (element.unitPrice * 1) / currencyRate;
                }
              });
              newSkuData.supplierNo = purchaseOrder.suppNo;
            }
            await this.skusService.createSku(newSkuData);
          }
          await this.productsService.updateProductCost(line.productId);
        }

        if (newStatus != PruchaseStatusEnumDto.ERROR_STATUS) {
          if (checkOperationStatus) {
            await this.stockOperationService.updateStatus(
              operationId,
              OperationStatusEnumDto.CLOSED,
            );
            await this.purchasesService.updateStatusErrorCount(
              moveNo,
              PruchaseStatusEnumDto.CLOSED,
            );
          } else {
            await this.stockOperationService.updateStatus(
              operationId,
              OperationStatusEnumDto.PARTIAL,
            );
            await this.purchasesService.updateStatusErrorCount(
              moveNo,
              newStatus,
            );
          }
        } else {
          await this.purchasesService.updateStatusErrorCount(moveNo, newStatus);
        }
      }
    } else {
      throw new NotFoundException('Stock Operation Not Found');
    }

    return true;
  }

  async getfilters(query: any): Promise<any> {
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy = query.orderBy ? query.orderBy : '';

    let where = {};

    const namedFilter = [];
    if (filter != null) {
    }

    // Filter Option
    for (let i = 0; i < filter.length; i++) {
      const propName = Object.keys(filter[i])[0];
      const PropValue = Object.values(filter[i])[0];
      if (propName === 'total') {
        const totalValue = PropValue;

        namedFilter.push({ total: { totalValue } });
      }
    }

    if (namedFilter.length === 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    //Search and matching
    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { status: searchPattern }, // Status
          { description: searchPattern }, // description
        ],
      };
      if (where['$and']) {
        where['$and'].push(searchFilter);
      } else if (Object.keys(where).length > 0) {
        const temp = where;
        where = {};
        where['$and'] = [temp, searchFilter];
      } else {
        where = searchFilter;
      }
    }

    const stocks = await this.stockMoveModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['destination']);

    const count = await this.stockMoveModel.countDocuments(where);
    return [stocks, count];
  }

  async findOneByItemId(id: string): Promise<StockMove> {
    const response = await this.stockMoveModel
      .findOne({ lineNumberId: id })
      .exec();

    if (!response) {
      throw new NotFoundException('stockmove not found');
    }

    return response;
  }

  async findChildren(id: string): Promise<StockMove[]> {
    const response = await this.stockMoveModel.find({
      originalMoveId: id,
    });
    return response;
  }

  async removeAllByOperation(operationId: string) {
    await this.stockMoveModel.deleteMany({ operationId: operationId });
  }

  async update(
    stockMoveId: string,
    updateStockMoveDto: UpdateStockMoveDto,
  ): Promise<StockMove> {
    const response = await this.stockMoveModel.findByIdAndUpdate(
      stockMoveId,
      updateStockMoveDto,
      {
        new: true,
      },
    );
    return response;
  }

  async remove(id: string): Promise<any> {
    const result = await this.stockMoveModel.findByIdAndRemove(id);
    return result;
  }

  async findByLineNumberId(lineNumberId: string): Promise<StockMove> {
    return await this.stockMoveModel.findOne({ lineNumberId: lineNumberId });
  }
  // Create Jounal Entry =======================================================>
  async createJournalEntryIncomingStock(
    stockMoveLine: StockMove[],
    purchaseOrder: any,
  ) {
    // required paymentTerm, localExport ?

    // console.log('what is stockMoveLine Captured', stockMoveLine);
    // console.log('what is purchaseOrder', purchaseOrder);

    const journalItems = [];
    let totalAmount = 0;
    // const taxAmt = 0;
    // let taxResult;

    // Calculate total
    for (const item of stockMoveLine) {
      purchaseOrder.purchaseOrderItems.forEach((element) => {
        if (element.SN === item.lineNumber) {
          totalAmount += item.arrivedQty * element.unitPrice;
        }
      });
    }

    //calc due date
    let dueDate = '';
    if (purchaseOrder.paymentTerm && purchaseOrder.delDate) {
      //get the pyament term
      const terms = await this.paymentTermsService.findOne(
        purchaseOrder.paymentTerm,
      );
      if (terms) {
        const invDate = moment(purchaseOrder.delDate);
        invDate.add(terms.days, 'days');
        dueDate = invDate.toISOString();
      }
    }

    if (purchaseOrder.currency) {
      //find purchase rate
      const currency = await this.currenciesService.findOne(
        purchaseOrder.currency._id,
      );

      for (let i = 0; i < currency.currencyRate.length; i++) {
        if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
          // Why Sale?? ================================================> ??
          if (currency.currencyRate[i].rate > 0) {
            purchaseOrder.currencyRate = currency.latestRate;
            break;
          }
        }
      }
    }

    const account = await this.accountJournalService.findOneByName('Move-In');

    let accountDebit: AccountItem, accountCredit: AccountItem;

    if (account) {
      // Get debit_account
      accountDebit = await this.accountItemService.findOne(
        account.debit_account,
      );
      // Get credit_account
      accountCredit = await this.accountItemService.findOne(
        account.credit_account,
      );
    } else {
      console.log('Account not found');
      throw new NotFoundException('Account Not Found');
    }

    const firstLine = {
      reference: purchaseOrder.poNumber,
      name: purchaseOrder.poNumber,
      partner: purchaseOrder.name,
      account: accountDebit ? accountDebit._id : undefined,
      dueDate: dueDate,
      debit: totalAmount,
      credit: 0,
      amountCurrency: 0,
      currency: purchaseOrder.currency ? purchaseOrder.currency._id : undefined,
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    };

    journalItems.push(firstLine);

    for (const item of stockMoveLine) {
      let listPrice = 0;
      purchaseOrder.purchaseOrderItems.forEach((element) => {
        if (element.SN === item.lineNumber) {
          listPrice = element.unitPrice;
        }
      });
      const product = await this.productsService.findOne(item.productId);
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const productItem = {
        reference: purchaseOrder.poNumber,
        name: item.description,
        partner: purchaseOrder.name,
        account: accountCredit ? accountCredit._id : undefined,
        dueDate: dueDate,
        debit: 0,
        credit: item.arrivedQty * listPrice,
        amountCurrency: 0,
        currency: purchaseOrder.currency
          ? purchaseOrder.currency._id
          : undefined, // purchaseOrder.currency.name,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };
      journalItems.push(productItem);
    }

    const journalData = {
      status: 'draft',
      journalEntryNum: '',
      remarks: undefined,
      reference: purchaseOrder.poNumber,
      toReview: false,
      totalCredit: totalAmount * purchaseOrder.currencyRate,
      totalDebit: totalAmount * purchaseOrder.currencyRate,
      journalValue: account ? account._id : undefined,
      journalItems: journalItems ? journalItems : [],
      entryDate: new Date(),
      modelId: purchaseOrder._id,
      modelName: 'StockMove',
    };

    // console.log('what is journalData', journalData);
    await this.journalEntryService.create(journalData);
  }

  async createJournalEntryOutgoingStock(stockMove) {
    console.log('stockMove', stockMove);
    console.log('stockMove.lines', stockMove.lines);

    // Find Account
    const account = await this.accountJournalService.findOneByName('Move-Out');
    console.log('what is account Move-Out', account);
    let accountDebit: AccountItem, accountCredit: AccountItem;
    if (account) {
      // Get debit_account
      accountDebit = await this.accountItemService.findOne(
        account.debit_account,
      );
      // Get credit_account
      accountCredit = await this.accountItemService.findOne(
        account.credit_account,
      );
    } else {
      console.log('Account not found');
      throw new NotFoundException('Account Not Found');
    }

    let totalAmount = 0;
    const journalItems = [];
    for (const item of stockMove.lines) {
      const sku = await this.skusService.findOneSkuOnly(item.skuId);
      if (!sku) {
        throw new NotFoundException('No Sku Found');
      }
      console.log('sku', sku);
      totalAmount += item.qty * sku.unitCost;
    }

    //find sale order and partner naem
    let partnerName = '';
    const operation = await this.stockOperationService.findById(
      stockMove.operationId,
    );
    if (operation) {
      const saleOrder = await this.salesordersService.findByName(
        operation.orderNo,
      );
      if (saleOrder) {
        partnerName = saleOrder.custName;
      }
    }

    const firstLine = {
      reference: stockMove.moveNo,
      name: stockMove.moveNo,
      partner: partnerName,
      account: accountCredit ? accountCredit._id : undefined,
      dueDate: new Date(),
      debit: 0,
      credit: totalAmount,
      amountCurrency: 0,
      currency: undefined,
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    };
    journalItems.push(firstLine);

    for (const item of stockMove.lines) {
      const sku = await this.skusService.findOneSkuOnly(item.skuId);
      if (!sku) {
        throw new NotFoundException('No Sku Found');
      }

      const productItem = {
        reference: stockMove.moveNo,
        name: item.description,
        partner: partnerName,
        account: accountDebit ? accountDebit._id : undefined,
        dueDate: undefined,
        debit: item.qty * sku.unitCost,
        credit: 0,
        amountCurrency: 0,
        currency: undefined,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };
      journalItems.push(productItem);
    }

    const journalData = {
      status: 'draft',
      journalEntryNum: '',
      remarks: undefined,
      reference: stockMove.moveNo,
      toReview: false,
      totalCredit: totalAmount,
      totalDebit: totalAmount,
      journalValue: account ? account._id : undefined,
      journalItems: journalItems ? journalItems : [],
      entryDate: new Date(),
      modelId: stockMove.operationId,
      modelName: 'StockMove',
    };
    await this.journalEntryService.create(journalData);
  }

  async findStockMoveBySkuId(skuId: string): Promise<StockMove[]> {
    const response = await this.stockMoveModel.find({
      skuId: skuId,
    });
    return response;
  }

  async findAllToExportCSV(query: any) {
    const stockOperations = await this.stockOperationService.findAllWithDate(
      query.startDate,
      query.endDate,
    );
    console.log('stock', stockOperations);
    const stockMoves = await this.stockMoveModel
      .find()
      .populate(['productId', 'skuId', 'destinationId']);
    const arr = [];
    if (stockMoves.length > 0 && stockOperations.length > 0) {
      for (const stockOperation of stockOperations) {
        await Promise.all(
          stockMoves.map(async (stockMove) => {
            //console.log('stockMove',stockMove)

            if (stockMove.operationId == stockOperation._id.toString()) {
              if (stockMove.skuId) {
                const sku = await this.skusService.findOneSku(stockMove.skuId);
                stockMove.skuId = sku;
              }

              const data = {
                productId: stockMove.productId,
                destinationId: stockMove.destinationId,
                skuId: stockMove.skuId,
                operationId: stockOperation,
                completedDate: moment(stockOperation.completedDate).format(
                  'DD/MM/YYYY',
                ),
                completedQty: stockMove.completedQty,
              };
              console.log('data',data)
              return arr.push(data);
            }
          }),
        );
      }
      return await arr;
    } else {
      const emptyData = {
        productId: '',
        destinationId: '',
        skuId: '',
        operationId: '',
        completedDate: '',
        completedQty: '',
      };
      arr.push(emptyData);
    }
    console.log('arr', arr);
    return await arr;
  }
}
