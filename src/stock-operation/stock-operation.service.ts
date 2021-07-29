import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateStockOperationDto,
  OperationStatusEnumDto,
} from './dto/create-stock-operation.dto';
import { StockOperation } from './stock-operation.interface';
import { SequenceSettingsService } from '../sequence-settings/sequence-settings.service';
import { StockLocationService } from '../stock-location/stock-location.service';
import { SkusService } from '../skus/skus.service';
import { StockMoveService } from '../stock-move/stock-move.service';
import { CreateSkusDto } from 'src/skus/dto/create-skus.dto';
import { StockMove } from 'src/stock-move/stock-move.interface';
import { Sku } from 'src/skus/skus.interface';
import { CreateStockMoveDto } from 'src/stock-move/dto/create-stock-move.dto';
import { PurchasesService } from '../purchase-order/purchase-order.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { WorkOrderPickingsService } from '../work-order-pickings/work-order-pickings.service';
import { DeliveryOrdersService } from '../delivery-orders/delivery-orders.service';
import { MoveDto } from 'src/stock-move/dto/save-stock-move.dto';
import { UpdateStockOperationDto } from './dto/update-stock-operation.dto';
import { AccountJournalService } from '../account-journal/account-journal.service';
import { PaymentTermsService } from '../payment-terms/payment-terms.service';
import { CurrenciesService } from '../currencies/currencies.service';
import { JournalEntryService } from 'src/journal-entry/journal-entry.service';
import { AccountItemService } from '../account-item/account-item.service';
import { AccountItem } from '../account-item/account-item.interface';
import { typeOfCurrency } from '../currencies/currencies.interface';
import { ProductsService } from '../products/products.service';
import { Product } from '../products/products.interface';
import { WorkOrder } from '../work-orders/interfaces/work-orders.interface';

@Injectable()
export class StockOperationService {
  constructor(
    @InjectModel('StockOperation')
    private readonly stockOperationModel: Model<StockOperation>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly stockLocationService: StockLocationService,
    @Inject(forwardRef(() => SkusService))
    private readonly skusService: SkusService,
    @Inject(forwardRef(() => StockMoveService))
    private readonly stockMoveService: StockMoveService,
    @Inject(forwardRef(() => PurchasesService))
    private purchasesService: PurchasesService,
    @Inject(forwardRef(() => SalesOrdersService))
    private salesordersService: SalesOrdersService,
    @Inject(forwardRef(() => WorkOrdersService))
    private workordersService: WorkOrdersService,
    @Inject(forwardRef(() => WorkOrderPickingsService))
    private workorderpickingsService: WorkOrderPickingsService,
    @Inject(forwardRef(() => DeliveryOrdersService))
    private deliveryordersService: DeliveryOrdersService,
    private accountJournalService: AccountJournalService,
    private paymentTermsService: PaymentTermsService,
    private currenciesService: CurrenciesService,
    private accountItemService: AccountItemService,
    private journalEntryService: JournalEntryService,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
  ) {}

  //get all stock data
  async findAll(): Promise<StockOperation[]> {
    const response = await this.stockOperationModel
      .find()
      .populate(['destination']);
    return response;
  }

  //find by id
  async findById(id: string): Promise<StockOperation> {
    const result = await this.stockOperationModel
      .findById(id)
      .populate(['destination']);
    return result;
  }

  async findByOrder(orderNo: string): Promise<StockOperation> {
    return this.stockOperationModel.findOne({ orderNo: orderNo });
  }

  //update status by id
  async updateStatus(id: string, status: string): Promise<StockOperation> {
    const updateInfo: any = { status: status };
    if (status == OperationStatusEnumDto.CLOSED) {
      updateInfo.completedDate = new Date();
    }
    const result = await this.stockOperationModel.findByIdAndUpdate(
      { _id: id },
      updateInfo,
      { new: true },
    );

    return result;
  }

  //create stock operation
  async createNewOperation(
    createStockOperationDto: CreateStockOperationDto,
  ): Promise<StockOperation> {
    const modelName = 'StockOperation';

    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    // Generate pattern
    const newMoveNum = this.sequenceSettingsService.sequenceSettingEx(settings);

    // To update property of SoNumber
    createStockOperationDto.moveNo = newMoveNum;

    // If nextNumber exist, update new Sequence number into dbase
    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settings,
    );

    console.log(
      'what is createStockOperationDto.destination',
      createStockOperationDto.destination,
    );

    const newOperation = new this.stockOperationModel(createStockOperationDto);
    const savedStockOperation = newOperation.save();

    return savedStockOperation;
  }

  async createInternalMove(
    createStockOperationDto: CreateStockOperationDto,
  ): Promise<Sku> {
    const modelName = 'StockOperation';
    //check if sku move qty is less than current qty
    const currentSKU = await this.skusService.findOneSku(
      createStockOperationDto.moveItems[0].skuId,
    );
    if (currentSKU.quantity < createStockOperationDto.moveItems[0].qty) {
      throw new BadRequestException(
        'You cannot move more than currenty quantity',
      );
    }
    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    // Generate pattern
    const newMoveNum = this.sequenceSettingsService.sequenceSettingEx(settings);

    // To update property of SoNumber
    createStockOperationDto.moveNo = newMoveNum;

    // If nextNumber exist, update new Sequence number into dbase
    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settings,
    );

    const newOperation = new this.stockOperationModel(createStockOperationDto);
    const savedStockOperation = await newOperation.save();

    if (currentSKU.quantity > createStockOperationDto.moveItems[0].qty) {
      //create a new sku
      const remaining =
        currentSKU.quantity - createStockOperationDto.moveItems[0].qty;
      const newCreateItem = new CreateSkusDto();
      newCreateItem.location = createStockOperationDto.destination;
      newCreateItem.quantity = createStockOperationDto.moveItems[0].qty;
      newCreateItem.unitCost = currentSKU.unitCost;
      newCreateItem.product = currentSKU.product;
      const newSKU = await this.skusService.createSku(newCreateItem);

      let newMoveItem = new CreateStockMoveDto();
      newMoveItem.productId = createStockOperationDto.moveItems[0].productId;
      newMoveItem.operationId = savedStockOperation._id;
      newMoveItem.skuId = currentSKU._id;
      newMoveItem.destinationId = createStockOperationDto.destination;
      newMoveItem.estimatedDate = new Date();
      newMoveItem.qty = currentSKU.quantity;
      newMoveItem.done = true;
      newMoveItem.remainingQty = remaining;
      newMoveItem.completedQty = createStockOperationDto.moveItems[0].qty;

      if (currentSKU.product) {
        newMoveItem.description =
          currentSKU.product.partNumber + ' ' + currentSKU.product.description;
      }
      newMoveItem.lineNumber = 1;

      const currentMove = await this.stockMoveService.createNewMove(
        newMoveItem,
      );
      await currentSKU.updateOne({ quantity: remaining });

      newMoveItem = new CreateStockMoveDto();
      newMoveItem.productId = createStockOperationDto.moveItems[0].productId;
      newMoveItem.operationId = savedStockOperation._id;
      newMoveItem.skuId = newSKU._id;
      newMoveItem.destinationId = createStockOperationDto.destination;
      newMoveItem.estimatedDate = new Date();
      newMoveItem.qty = createStockOperationDto.moveItems[0].qty;
      newMoveItem.done = true;
      newMoveItem.remainingQty = 0;
      newMoveItem.completedQty = createStockOperationDto.moveItems[0].qty;
      newMoveItem.originalMoveId = currentMove._id;
      if (currentSKU.product) {
        newMoveItem.description =
          currentSKU.product.partNumber + ' ' + currentSKU.product.description;
      }
      newMoveItem.lineNumber = 2;

      await this.stockMoveService.createNewMove(newMoveItem);
    } else {
      await currentSKU.updateOne({
        location: createStockOperationDto.destination,
      });
      const newMoveItem = new CreateStockMoveDto();
      newMoveItem.productId = createStockOperationDto.moveItems[0].productId;
      newMoveItem.operationId = savedStockOperation._id;
      newMoveItem.skuId = currentSKU._id;
      newMoveItem.destinationId = createStockOperationDto.destination;
      newMoveItem.estimatedDate = new Date();
      newMoveItem.qty = createStockOperationDto.moveItems[0].qty;
      newMoveItem.done = true;
      newMoveItem.remainingQty = 0;
      newMoveItem.completedQty = createStockOperationDto.moveItems[0].qty;
      if (currentSKU.product) {
        newMoveItem.description =
          currentSKU.product.partNumber + ' ' + currentSKU.product.description;
      }
      newMoveItem.lineNumber = 1;

      const currentMove = await this.stockMoveService.createNewMove(
        newMoveItem,
      );
    }

    return currentSKU;
  }

  async getfilters(query: any): Promise<any> {
    console.log(query);
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { moveNo: -1 };

    let where = {};

    const namedFilter = [];

    // Filter Option
    for (let i = 0; i < filter.length; i++) {
      const propName = Object.keys(filter[i])[0];
      const PropValue: any = Object.values(filter[i])[0];
      if (propName == 'type') {
        // ignores case senstive
        const regex = new RegExp(PropValue, 'i');
        namedFilter.push({ type: regex });
      } else if (propName == 'status') {
        if (Array.isArray(PropValue)) {
          const a1 = PropValue as Array<string>;
          namedFilter.push({ status: { $in: a1 } });
        } else {
          namedFilter.push({ status: PropValue });
        }
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
          { type: searchPattern }, // Type
          { moveNo: searchPattern }, //moveno
          { orderNo: searchPattern }, //orderno
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

    const stocks = await this.stockOperationModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['destination']);

    await Promise.all(
      stocks.map(async (item) => {
        if (item.type == 'Incoming') {
          const purchase = await this.purchasesService.findByName(item.orderNo);
          if (purchase) {
            item.set('partner', purchase.name, { strict: false });
          } else {
            item.set('partner', '', { strict: false });
          }
        } else if (item.type == 'outgoing') {
          const sales = await this.salesordersService.findByName(item.orderNo);
          if (sales) {
            item.set('partner', sales.custName, { strict: false });
          } else {
            item.set('partner', '', { strict: false });
          }
        } else {
          item.set('partner', '', { strict: false });
        }
        return item;
      }),
    );

    const count = await this.stockOperationModel.countDocuments(where);
    return [stocks, count];
  }

  async createOutgoingStockMove(deliveryOrderId: string) {
    const deliveryOrder = await this.deliveryordersService.findOneDeliveryOrder(
      deliveryOrderId,
    );
    //const workOrder = await this.workordersService.getWorkOrderByOrderId(deliveryOrder.orderId);
    const modelName = 'StockOperation';
    const stockLocation = await this.stockLocationService.getStockByName(
      'customer',
    );
    if (deliveryOrder && stockLocation) {
      const saleOrder = await this.salesordersService.findOne(
        deliveryOrder.orderId,
      );
      const settings = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );
      // Generate pattern
      const newMoveNum = this.sequenceSettingsService.sequenceSettingEx(
        settings,
      );

      // If nextNumber exist, update new Sequence number into dbase
      await this.sequenceSettingsService.updateSequenceByModelName(
        modelName,
        settings,
      );

      const stockOperationPayload = {
        type: 'outgoing', // ??
        orderNo: saleOrder.soNumber,
        destination: stockLocation._id, // ?
        moveNo: newMoveNum,
        status: 'closed',
      };
      const newOperation = new this.stockOperationModel(stockOperationPayload);
      const savedStockOperation = await newOperation.save();
      //save stock moves
      //find items that were delivered
      //find work order items that were delivered
      const saveMovePayload: MoveDto = {
        date: new Date(),
        moveNo: deliveryOrder.soNumber,
        operationId: savedStockOperation._id,
        destinationId: stockLocation._id,
        lines: [],
      };
      for (let i = 0; i < deliveryOrder.deliveryLines.length; i++) {
        //find pickings
        const pickings = await this.workorderpickingsService.findAllWorkOrderPickingsItemByWoItemId(
          deliveryOrder.deliveryLines[i].woItemId,
        );
        for (let j = 0; j < pickings.length; j++) {
          const stockMovePayload = {
            lineId: deliveryOrder.deliveryLines[i]._id,
            description: deliveryOrder.deliveryLines[i].description,
            productId: pickings[j].productId,
            skuId: pickings[j].pickedSkuId,
            qty: pickings[j].workQty,
          };
          saveMovePayload.lines.push(stockMovePayload);
          //deduct stocks
          const pickedSku = await this.skusService.findOneSkuOnly(
            pickings[j].pickedSkuId,
          );
          const newQty = pickedSku.quantity - pickings[j].workQty;
          this.skusService.updateSku(pickings[j].pickedSkuId, {
            quantity: newQty,
          });
        }
      }

      await this.stockMoveService.createNewFromStockOperation(saveMovePayload);
    } else {
      if (!deliveryOrder) {
        console.log('Delivery order is missing!');
      } else {
        throw new NotFoundException('Customer location is missing!');
      }
    }
  }

  async createOutgoingStockMoveFromWorkOrder(
    pickingList,
    workOrder: WorkOrder,
  ) {
    //const workOrder = await this.workordersService.getWorkOrderByOrderId(deliveryOrder.orderId);
    const modelName = 'StockOperation';
    const stockLocation = await this.stockLocationService.getStockByName(
      'customer',
    );
    if (stockLocation) {
      // console.log('stockLocation', stockLocation);
      const saleOrder = await this.salesordersService.findOne(
        workOrder.orderId,
      );

      console.log('soNumber', saleOrder.soNumber);
      const settings = await this.sequenceSettingsService.FindSequenceByModelName(
        modelName,
      );
      // Generate pattern
      const newMoveNum = this.sequenceSettingsService.sequenceSettingEx(
        settings,
      );
      console.log('newMoveNum', newMoveNum);

      await this.sequenceSettingsService.updateSequenceByModelName(
        modelName,
        settings,
      );

      const stockOperationPayload = {
        type: 'outgoing',
        orderNo: saleOrder.soNumber,
        destination: stockLocation._id,
        moveNo: newMoveNum,
        status: 'closed',
      };
      const newOperation = new this.stockOperationModel(stockOperationPayload);
      const savedStockOperation = await newOperation.save();

      const saveMovePayload: MoveDto = {
        date: new Date(),
        moveNo: workOrder.soNumber,
        operationId: savedStockOperation._id,
        destinationId: stockLocation._id,
        lines: [],
      };
      for (let i = 0; i < pickingList.length; i++) {
        const sku = await this.skusService.findOneSkuOnly(
          pickingList[i].pickedSkuId,
        );

        const product = await this.productsService.findOneProductForWO(
          sku.product,
        );

        const stockMovePayload = {
          lineId: pickingList[i]._id, // replace from Do Id to PickingId
          description: product.description, // <== Product description based pickedSku ==>
          productId: pickingList[i].productId, // This product is from SalesOrder Line ProducId
          skuId: pickingList[i].pickedSkuId,
          qty: pickingList[i].workQty,
        };

        saveMovePayload.lines.push(stockMovePayload);
        //deduct stocks
        const pickedSku = await this.skusService.findOneSkuOnly(
          pickingList[i].pickedSkuId,
        );
        const newQty = pickedSku.quantity - pickingList[i].workQty;

        // Update sku Quantity
        await this.skusService.updateSku(pickingList[i].pickedSkuId, {
          quantity: newQty,
        });
      }

      return await this.stockMoveService.createNewFromStockOperation(
        saveMovePayload,
      );
    }
  }

  async addStock(createStockOperationDto: CreateStockOperationDto) {
    const modelName = 'StockOperation';

    let product: Product = null;
    let currentSKU = null;
    let unitCost = 0;

    // If select onSelectProduct, find product, else find Sku
    if (createStockOperationDto.onSelectProduct) {
      console.log('Find Product');
      product = await this.productsService.findOne(
        createStockOperationDto.moveItems[0].productId,
      );
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      // get costing from product
      unitCost = product.averagePrice;
    } else {
      console.log('Find Sku');
      currentSKU = await this.skusService.findOneSku(
        createStockOperationDto.moveItems[0].skuId,
      );
      if (!currentSKU) {
        throw new NotFoundException('Sku not found');
      }
      // get costing from sku
      unitCost = currentSKU.unitCost;
    }

    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    // Generate pattern
    const newMoveNum = this.sequenceSettingsService.sequenceSettingEx(settings);

    createStockOperationDto.moveNo = newMoveNum;

    // If nextNumber exist, update new Sequence number into dbase
    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settings,
    );

    // Create Stock Operation
    const newOperation = new this.stockOperationModel(createStockOperationDto);
    const savedStockOperation = await newOperation.save();

    // Create Sku
    const createSkusDto = new CreateSkusDto();
    createSkusDto.location = createStockOperationDto.destination;
    createSkusDto.quantity = createStockOperationDto.moveItems[0].qty;
    createSkusDto.unitCost = unitCost;
    createSkusDto.product = createStockOperationDto.onSelectProduct
      ? product._id
      : currentSKU.product;

    // pass this newSKU to createJournalEntryMoveIn()
    const newSKU = await this.skusService.createSku(createSkusDto);

    // Create Stock Move
    const createStockMoveDto = new CreateStockMoveDto();
    createStockMoveDto.productId = newSKU.product;
    createStockMoveDto.operationId = savedStockOperation._id;
    createStockMoveDto.skuId = newSKU._id; // new or Currenct SKU ID  =============== > ???
    createStockMoveDto.destinationId = createStockOperationDto.destination;
    createStockMoveDto.estimatedDate = new Date();
    createStockMoveDto.qty = createStockOperationDto.moveItems[0].qty;
    createStockMoveDto.done = true;
    createStockMoveDto.remainingQty = 0;
    createStockMoveDto.completedQty = createStockOperationDto.moveItems[0].qty;
    createStockMoveDto.description = createStockOperationDto.onSelectProduct
      ? product.description
      : currentSKU.product.description;
    createStockMoveDto.lineNumber = 1;

    const stockMove = await this.stockMoveService.createNewMove(
      createStockMoveDto,
    );

    // Call createJournalEntryAddStock Function
    await this.createJournalEntryAddStock(stockMove, newMoveNum, newSKU);
  }

  async update(
    id: string,
    updateStockOperationDto: UpdateStockOperationDto,
  ): Promise<StockOperation> {
    const response = await this.stockOperationModel.findByIdAndUpdate(
      id,
      updateStockOperationDto,
      {
        new: true,
      },
    );
    return response;
  }

  async updateOrderNo(
    id: string,
    updateOrderNo: string,
  ): Promise<StockOperation> {
    return await this.stockOperationModel.findByIdAndUpdate(id, {
      orderNo: updateOrderNo,
      new: true,
    });
  }

  async removeStock(createStockOperationDto: CreateStockOperationDto) {
    const modelName = 'StockOperation';

    // find sku
    console.log('Find Sku');
    const currentSKU = await this.skusService.findOneSku(
      createStockOperationDto.moveItems[0].skuId,
    );
    console.log('currentSKU', currentSKU);
    if (!currentSKU) {
      throw new NotFoundException('Sku not found');
    }

    console.log('createStockOperationDto', createStockOperationDto);

    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    // Generate pattern
    const newMoveNum = this.sequenceSettingsService.sequenceSettingEx(settings);

    createStockOperationDto.moveNo = newMoveNum;
    createStockOperationDto.status = OperationStatusEnumDto.CLOSED;

    // If nextNumber exist, update new Sequence number into dbase
    await this.sequenceSettingsService.updateSequenceByModelName(
      modelName,
      settings,
    );

    // Create Stock Operation
    const newOperation = new this.stockOperationModel(createStockOperationDto);
    const savedStockOperation = await newOperation.save();

    // Create Sku
    //const createSkusDto = new CreateSkusDto();
    //createSkusDto.location = createStockOperationDto.destination;
    //createSkusDto.quantity = createStockOperationDto.moveItems[0].qty;
    //createSkusDto.unitCost = currentSKU.unitCost;
    //createSkusDto.product = currentSKU.product;

    // pass this newSKU to createJournalEntryMoveIn()
    //const newSKU = await this.skusService.createSku(createSkusDto);

    // Create Stock Move
    const allStockMoves = [];
    const allUnitCosts = [];
    for (let i = 0; i < createStockOperationDto.moveItems.length; i++) {
      const createStockMoveDto = new CreateStockMoveDto();
      createStockMoveDto.productId =
        createStockOperationDto.moveItems[i].productId;
      createStockMoveDto.operationId = savedStockOperation._id;
      const sku = await this.skusService.findOneSku(
        createStockOperationDto.moveItems[i].skuId,
      );
      createStockMoveDto.skuId = sku._id; // current or new SKU_ID ==================?
      createStockMoveDto.destinationId = createStockOperationDto.destination;
      createStockMoveDto.estimatedDate = new Date();
      createStockMoveDto.qty = createStockOperationDto.moveItems[i].qty;
      createStockMoveDto.done = true;
      createStockMoveDto.remainingQty = 0;
      createStockMoveDto.completedQty =
        createStockOperationDto.moveItems[i].qty;
      if (sku.product) {
        createStockMoveDto.description = sku.product.description;
      }
      createStockMoveDto.lineNumber = i + 1;

      const stockMove = await this.stockMoveService.createNewMove(
        createStockMoveDto,
      );

      // Update Current SKU by deducting current SKU quantity
      sku.quantity = sku.quantity - createStockOperationDto.moveItems[i].qty;
      await sku.save();
      allStockMoves.push(stockMove);
      allUnitCosts.push(sku.unitCost);
    }

    // Call createJournalEntryMoveOut Function
    await this.createJournalEntryRemoveStock(
      allStockMoves,
      newMoveNum,
      allUnitCosts,
    );
  }

  async createJournalEntryAddStock(
    stockMove: StockMove,
    moveNo: string,
    newSKU: Sku,
  ) {
    const journalItems = [];
    let totalAmount = 0;

    if (newSKU) {
      totalAmount = stockMove.completedQty * newSKU.unitCost;

      // Find Account
      const account = await this.accountJournalService.findOneByName(
        'Add-stock',
      );
      console.log('what is account Move-in', account);
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
        reference: moveNo,
        name: stockMove.description,
        partner: undefined,
        account: accountDebit ? accountDebit._id : undefined,
        dueDate: new Date(),
        debit: totalAmount,
        credit: 0,
        amountCurrency: 0,
        currency: undefined,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };
      journalItems.push(firstLine);

      const productItem = {
        reference: moveNo,
        name: stockMove.description,
        partner: undefined,
        account: accountCredit ? accountCredit._id : undefined,
        dueDate: undefined,
        debit: 0,
        credit: totalAmount,
        amountCurrency: 0,
        currency: undefined,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };
      journalItems.push(productItem);

      const journalData = {
        status: 'draft',
        journalEntryNum: '',
        remarks: undefined,
        reference: undefined,
        toReview: false,
        totalCredit: totalAmount,
        totalDebit: totalAmount,
        journalValue: account ? account._id : undefined,
        journalItems: journalItems ? journalItems : [],
        entryDate: new Date(),
        modelId: stockMove._id,
        modelName: 'StockMove',
      };
      await this.journalEntryService.create(journalData);
    } else {
      throw new NotFoundException('SkU not Found');
    }
  }

  async createJournalEntryRemoveStock(
    stockMove: Array<StockMove>,
    moveNo: string,
    skuUnitCost: Array<number>,
  ) {
    const journalItems = [];
    let totalAmount = 0;

    //if (skuUnitCost > 0) {

    // Find Account
    const account = await this.accountJournalService.findOneByName('Scrap');

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

    stockMove.forEach((move, index) => {
      totalAmount += move.completedQty * skuUnitCost[index];
      const productItem = {
        reference: moveNo,
        name: move.description,
        partner: undefined,
        account: accountDebit ? accountDebit._id : undefined,
        dueDate: undefined,
        debit: move.completedQty * skuUnitCost[index],
        credit: 0,
        amountCurrency: move.completedQty * skuUnitCost[index],
        currency: undefined,
        taxAmount: 0,
        reconcile: '',
        partialReconcile: '',
      };
      journalItems.push(productItem);
    });

    const firstLine = {
      reference: moveNo,
      name: '',
      partner: undefined,
      account: accountCredit ? accountCredit._id : undefined,
      dueDate: new Date(),
      debit: 0,
      credit: totalAmount,
      amountCurrency: totalAmount,
      currency: undefined,
      taxAmount: 0,
      reconcile: '',
      partialReconcile: '',
    };
    journalItems.unshift(firstLine);

    const journalData = {
      status: 'draft',
      journalEntryNum: '',
      remarks: undefined,
      reference: moveNo,
      toReview: false,
      totalCredit: totalAmount,
      totalDebit: totalAmount,
      journalValue: account ? account._id : undefined,
      journalItems: journalItems ? journalItems : [],
      entryDate: new Date(),
      modelName: 'StockOperation',
    };
    await this.journalEntryService.create(journalData);
    //} else {
    //throw new NotFoundException('SkU not Found');
    //}
  }

  async findAllWithDate(startDate, endDate) {
    const stockOperation = await this.stockOperationModel.find({
      createdDate: { $gte: startDate, $lte: endDate },
    });

    return stockOperation;
  }

  async RemoveAllStockOperationBySoNumber(
    soNumber: string,
    workOrderId: string,
  ): Promise<boolean> {
    const stockOperations = await this.stockOperationModel.find({
      orderNo: soNumber,
    });

    if (stockOperations && stockOperations.length > 0) {
      for (const item of stockOperations) {
        const stockMoves: StockMove[] = await this.stockMoveService.findMoveLines(
          item._id,
        );

        if (!stockMoves) {
          throw new BadRequestException(
            'StockMove not found, reset ops aborted',
          );
        }

        if (stockMoves && stockMoves.length > 0) {
          for (const stockMove of stockMoves) {
            const sku = await this.skusService.findOneSkuOnly(stockMove.skuId);
            if (sku) {
              const restoredSkuQty = sku.quantity + stockMove.completedQty;
              sku.quantity = restoredSkuQty;

              if (sku.rsvd && sku.rsvd.length > 0) {
                console.log('sku.rsvd', sku.rsvd);

                function search(item: { [x: string]: any }) {
                  return Object.keys(this).some(
                    (key) => item[key] !== this[key],
                  );
                }

                const query = {
                  woId: String(workOrderId),
                };

                const skuReserveRemoved = sku.rsvd.filter(search, query);
                console.log('what is skuReservedremoved', skuReserveRemoved);

                sku.rsvd = skuReserveRemoved;
              }
              await sku.save();
            } else {
              throw new BadRequestException('Sku not found, reset ops aborted');
            }
          }
          const removedStockMove = await this.stockMoveService.removeAllByOperation(
            item._id,
          );
          console.log('StockMove Removed if any', removedStockMove);
        }
      }
      const removedStockOperation = await this.stockOperationModel.deleteMany({
        orderNo: soNumber,
      });

      console.log('removedStockOperation', removedStockOperation);
    } else {
      throw new NotFoundException('Stock operation not found, ops aborted');
    }

    return true;
  }

  async removeSelectedStockOperationById(
    stockOperationIds: any[],
    catchStockMoveIds: any[],
  ) {
    const uniStockOpIds = stockOperationIds.filter(
      (operationIds, index, array) =>
        array.indexOf(operationIds) === index ? operationIds : '',
    );
    // console.log('uniStockOpIds', uniStockOpIds);

    if (uniStockOpIds.length > 0) {
      for (const operationId of uniStockOpIds) {
        // const journalEntries = await this.journalEntryService.findOneWithModelId(
        //   operationId,
        // );
        // if (!journalEntries) {
        //   // This may happen
        //   throw new NotFoundException(
        //     'Journal Entries not found due to old workOrder',
        //   );
        // }

        await this.journalEntryService.removeJournalEntryWithModelId(
          operationId,
        );
        await this.stockOperationModel.findByIdAndDelete(operationId);
      }
    } else {
      // Rare
      throw new NotFoundException('No Stock Operation Found, reset aborted');
    }

    const uniMoveIds = catchStockMoveIds.filter((moveIds, index, array) =>
      array.indexOf(moveIds) === index ? moveIds : '',
    );
    // console.log('uniMoveIds', uniMoveIds);
    if (uniMoveIds.length > 0) {
      for (const stockMoveId of uniMoveIds) {
        await this.stockMoveService.remove(stockMoveId);
      }
    } else {
      // Rare
      throw new NotFoundException('No Stock Moves Found, reset aborted');
    }
  }
}
