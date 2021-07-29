import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import {
  CreatePurchaseDto,
  PruchaseStatusEnumDto,
} from './dto/create-purchase-order.dto';
import { UpdatePurchaseDto } from './dto/update-purchase-order.dto';
import { Purchase } from './purchase-order.interface';
import { SequenceSettingsService } from 'src/sequence-settings/sequence-settings.service';
import { PaymentTermsService } from 'src/payment-terms/payment-terms.service';
import { CurrenciesService } from 'src/currencies/currencies.service';
import { IncotermService } from 'src/incoterm/incoterm.service';
import { BomsService } from './../boms/boms.service';
import { TaxesService } from './../taxes/taxes.service';
import { SkusService } from './../skus/skus.service';
import { ProductsService } from './../products/products.service';
import { DiscountsService } from 'src/discounts/discounts.service';
import { UomService } from '../uom/uom.service';
import { StockMoveService } from 'src/stock-move/stock-move.service';
import { StockOperationService } from 'src/stock-operation/stock-operation.service';
import { StockLocationService } from 'src/stock-location/stock-location.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.interface';
import { OperationStatusEnumDto } from 'src/stock-operation/dto/create-stock-operation.dto';
import { ApprovalRightsService } from '../approval-rights/approval-rights.service';
import { PaymentTerm } from '../payment-terms/interfaces/payment-terms.interface';
import { Currency } from '../currencies/currencies.interface';
import { Incoterm } from '../incoterm/incoterm.interface';
import { CreatePurchaseBySelectionDto } from './dto/create-by-selection-purchase-order.dto';
import { PurchaseListTempService } from '../purchase-list-temp/purchase-list-temp.service';
import { SupplierService } from '../supplier/supplier.service';

@Injectable()
export class PurchasesService {
  // added constructor
  constructor(
    @InjectModel('Purchase')
    private readonly purchaseModel: Model<Purchase>,
    private readonly sequenceSettingsService: SequenceSettingsService,
    @Inject(forwardRef(() => StockMoveService))
    private stockMoveService: StockMoveService,
    @Inject(forwardRef(() => StockOperationService))
    private readonly stockOperationService: StockOperationService,
    private readonly stockLocationService: StockLocationService,
    private readonly paymentTermsService: PaymentTermsService,
    private readonly incotermService: IncotermService,
    private readonly currenciesService: CurrenciesService,
    private readonly taxesService: TaxesService,
    private readonly bomsService: BomsService,
    @Inject(forwardRef(() => SkusService))
    private skusService: SkusService,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    private readonly discountsService: DiscountsService,
    private readonly uomService: UomService,
    private readonly usersService: UsersService,
    private readonly approvalRightsService: ApprovalRightsService,
    private readonly purchaseListTempService: PurchaseListTempService,
    private readonly supplierService: SupplierService,
  ) {}

  // Create New Purchase
  async create(createPurchaseDto: CreatePurchaseDto) {
    const keys = Object.keys(createPurchaseDto);
    console.log('createPurchaseDto', createPurchaseDto);
    console.log('keys', keys);

    if (
      createPurchaseDto.purchaseOrderItems &&
      createPurchaseDto.purchaseOrderItems.length > 0
    ) {
      for (const poItem of createPurchaseDto.purchaseOrderItems) {
        if (typeof poItem.SN !== 'number' || poItem.SN !== poItem.SN) {
          throw new BadRequestException('Some lines are not a number');
        }
      }
      createPurchaseDto.purchaseOrderItems.sort((a, b) => a.SN - b.SN);
    }

    createPurchaseDto.status = PruchaseStatusEnumDto.DRAFT;
    const newPurchase = new this.purchaseModel(createPurchaseDto);
    const quote = await newPurchase.save();
    return this.findOne(quote._id);
  }

  // Create New Purchase from Sales Order
  async createPurchaseOrderFromSalesOrder(
    createPurchaseDto: UpdatePurchaseDto,
  ) {
    const newPurchase = new this.purchaseModel(createPurchaseDto);
    const quote = await newPurchase.save();
    return this.findOne(quote._id);
  }

  // Create new Version of Purchase
  async createNewVersionPurchase(purchase: Purchase) {
    if (purchase.latestPurchase === false) {
      throw new ForbiddenException(
        'New version has been created, creating new is forbidden',
      );
    }
    const newPurchase = {
      createdDate: new Date(),
      salesPic: purchase.purchasePic,
      suppNo: purchase.suppNo,
      name: purchase.name,
      address: purchase.address,
      telNo: purchase.telNo,
      faxNo: purchase.faxNo,
      buyerName: purchase.buyerName,
      buyerEmail: purchase.buyerEmail,
      poNumber: purchase.poNumber,
      delAddress: purchase.delAddress,
      remarks: purchase.remarks,
      status: purchase.status,
      latestPurchase: true,
      incoterm: purchase.incoterm,
      paymentTerm: purchase.paymentTerm,
      currency: purchase.currency,
      discount: purchase.discount,
      total: purchase.total,
      gst: purchase.gst,
      purchaseOrderItems: purchase.purchaseOrderItems,
    };
  }

  // Find All Purchases
  async findAll(): Promise<Purchase[]> {
    const response = await this.purchaseModel
      .find()
      .populate(['currency', 'paymentTerm', 'incoterm']);
    return response;
  }

  //Find All + FilterDto
  async getfilters(query: any): Promise<any> {
    const limit = parseInt(query.limit ? query.limit : 0);
    const skip = parseInt(query.skip ? query.skip : 0);
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { poNumber: -1 };

    let where = {};

    const namedFilter = [];

    // Filter Option
    for (let i = 0; i < filter.length; i++) {
      const propName = Object.keys(filter[i])[0];
      const PropValue = Object.values(filter[i])[0];

      console.log('PROPS', propName, PropValue);
      if (propName === 'total' || propName === 'grandTotalAmt') {
        if (Array.isArray(PropValue)) {
          if (PropValue[0] === '') {
            // if min field is empty, filter (less than)
            namedFilter.push({ total: { $lte: parseInt(PropValue[1]) } });
          } else if (PropValue[1] === '') {
            // if max field is empty, filter (greater than)
            namedFilter.push({ total: { $gte: parseInt(PropValue[0]) } });
          } else {
            // else filter (greater and lesser)
            namedFilter.push({
              total: {
                $gte: parseInt(PropValue[0]),
                $lte: parseInt(PropValue[1]),
              },
            });
          }
        } else {
          namedFilter.push({
            total: {
              $gte: PropValue,
            },
          });
        }
      } else if (propName == 'status') {
        if (Array.isArray(PropValue)) {
          const a1 = PropValue as Array<string>;
          namedFilter.push({ status: { $in: a1 } });
        } else {
          namedFilter.push({ status: PropValue });
        }
      } else if (propName == 'purchaseType') {
        if (Array.isArray(PropValue)) {
          const a1 = PropValue as Array<string>;
          namedFilter.push({ purchaseType: { $in: a1 } });
        } else {
          namedFilter.push({ purchaseType: PropValue });
        }
      } else if (propName === 'createdDate') {
        if (Array.isArray(PropValue)) {
          if (PropValue[0] === 0) {
            // if Min field is empty, filter lesser
            namedFilter.push({ createdDate: { $lte: PropValue[1] } });
          } else {
            // if Min field is not empty, filter greater and lesser
            namedFilter.push({
              createdDate: { $gte: PropValue[0], $lte: PropValue[1] },
            });
          }
        } else {
          // if Max field is empty, it is not in Array
          namedFilter.push({ createdDate: { $gte: PropValue } });
        }
      } else if (propName === 'purchasePic') {
        const response = await this.usersService.findAllPic();
        const searchId = [];

        if (Array.isArray(PropValue)) {
          for (let i = 0; i < PropValue.length; i++) {
            for (let j = 0; j < response.length; j++) {
              if (
                `${response[j].firstName} ${response[j].lastName}` ===
                PropValue[i]
              ) {
                searchId.push(response[j]._id);
                // break;
              }
            }
          }
        } else {
          // for single pic filter
          for (let i = 0; i < response.length; i++) {
            if (
              `${response[i].firstName} ${response[i].lastName}` === PropValue
            ) {
              searchId.push(response[i]._id);
              break;
            }
          }
        }
        namedFilter.push({ purchasePic: { $in: searchId } });
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
          { suppRef: searchPattern }, // purchase Ref
          { suppNo: searchPattern }, // Supplier Number
          { name: searchPattern }, // Supplier name
          { poNumber: searchPattern }, // PO Number
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

    const purchases = await this.purchaseModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy)
      .populate(['currency', 'paymentTerm', 'incoterm', 'purchasePic']);

    for (let i = 0; i < purchases.length; i++) {
      const grandTotalAmt = purchases[i].subTotal + purchases[i].gstAmount;
      purchases[i].set('grandTotalAmt', grandTotalAmt, {
        strict: false,
      });
    }

    const count = await this.purchaseModel.countDocuments(where);
    return [purchases, count];
  }

  // Fetch AllPpurchases Group
  async getAllPurchaseDropdownGroup() {
    const paymentTerm = await this.paymentTermsService.findAll();
    const incoterm = await this.incotermService.findAll();
    const currency = await this.currenciesService.findAll();
    const personIncharge = await this.usersService.findAllPic();
    const discounts = await this.discountsService.findType('purchase');
    const uom = await this.uomService.findAll();

    const users = await this.usersService.findAllPic();
    const userlist = users.map((user) => ({
      name: user.firstName + ' ' + user.lastName,
      id: user.id,
    }));
    const gst = await this.taxesService.findAll();

    return {
      paymentTerm,
      incoterm,
      currency,
      personIncharge,
      discounts,
      uom,
      gst,
      userlist,
    };
  }

  // Find status by Id
  async findStatusById(id: string): Promise<Purchase> {
    const statusFound = await this.purchaseModel.findOne({ _id: id }).exec();

    if (!statusFound) {
      throw new NotFoundException('Purchase not found');
    }

    if (statusFound && statusFound.status === PruchaseStatusEnumDto.DRAFT) {
      throw new BadRequestException('In draft Mode, request denied');
    }

    return statusFound;
  }

  //Update Status Error Count
  async updateStatusErrorCount(poNumber: string, status: string) {
    //check if status == error count
    const purchase = await this.purchaseModel.findOne({ poNumber: poNumber });
    if (purchase) {
      if (purchase.status != PruchaseStatusEnumDto.ERROR_STATUS) {
        const result = await this.purchaseModel.findOneAndUpdate(
          { poNumber: poNumber },
          { status: status },
          { new: true },
        );

        return result;
      }
    }
    return null;
  }

  // Update isConvert:true to lock this purchase
  async updateConvertStatus(id: string) {
    const purchaseFound = await this.purchaseModel.findById(id);

    if (purchaseFound) {
      if (purchaseFound.isConverted === false) {
        await this.purchaseModel.findByIdAndUpdate(
          id,
          { isConverted: true },
          { new: true },
        );
      }
      throw new NotFoundException(`This purchase was converted`);
    }
  }

  // Update latestPurchase value to false
  async updatePurchaseStatus(id: string) {
    await this.purchaseModel.findByIdAndUpdate(
      id,
      { latestPurchase: false },
      { new: true },
    );
    return this.findOne(id);
  }

  // Find Purchase by ID
  async findOne(id: string, user?: User): Promise<Purchase> {
    const response = await this.purchaseModel
      .findOne({ _id: id })
      .populate(['currency', 'paymentTerm', 'incoterm', 'user']);
    // console.log(user);
    //check approval
    if (user) {
      const canApprove = await this.approvalRightsService.checkApprovalStatus(
        user,
        'purchase',
        response.total,
      );
      response.set('canApprove', canApprove, { strict: false });
    }
    return response;
  }

  async findByName(name: string): Promise<Purchase> {
    return await this.purchaseModel
      .findOne({ poNumber: name })
      .populate(['currency', 'paymentTerm', 'incoterm', 'user']);
  }

  // Update Purchase by ID
  async update(
    id: string,
    user: User,
    updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    // const modelName = 'Purchase';
    const purchaseFound = await this.purchaseModel.findOne({ _id: id }).exec();
    //console.log('found',purchaseFound)
    if (!purchaseFound) {
      throw new NotFoundException(`This purchase doesn't exist`);
    }

    const { status } = purchaseFound;
    let poNumber = purchaseFound.poNumber;

    if (status === PruchaseStatusEnumDto.CANCELLED) {
      throw new BadRequestException(
        'Puchase order has been cancelled, request denied',
      );
    }
    if (status === PruchaseStatusEnumDto.CLOSED) {
      throw new BadRequestException(
        'Puchase order has been closed, request denied',
      );
    }
    if (status === PruchaseStatusEnumDto.PARTIAL) {
      throw new BadRequestException(
        'Puchase order is partially moved. request denied',
      );
    }

    if (
      updatePurchaseDto.purchaseOrderItems &&
      updatePurchaseDto.purchaseOrderItems.length > 0
    ) {
      for (const poItem of updatePurchaseDto.purchaseOrderItems) {
        if (typeof poItem.SN !== 'number' || poItem.SN !== poItem.SN) {
          throw new BadRequestException('Some lines are not a number');
        }
      }
      updatePurchaseDto.purchaseOrderItems.sort((a, b) => a.SN - b.SN);
    }

    if (
      updatePurchaseDto.status === PruchaseStatusEnumDto.OPEN &&
      updatePurchaseDto.status !== status
    ) {
      if (updatePurchaseDto.poNumber) {
        poNumber = updatePurchaseDto.poNumber;
      }
      if (!poNumber) {
        throw new BadRequestException('PO Number required.');
      }
      //check if Approval is required
      const canApprove = await this.approvalRightsService.checkApprovalStatus(
        user,
        'purchase',
        purchaseFound.total,
      );
      console.log('can', canApprove);
      if (!canApprove) {
        if (status == PruchaseStatusEnumDto.REQUEST) {
          throw new BadRequestException(
            'You do not rights to approve this Purchase',
          );
        } else {
          updatePurchaseDto.status = PruchaseStatusEnumDto.REQUEST;
        }
      } else {
        if (
          status == PruchaseStatusEnumDto.DRAFT ||
          status == PruchaseStatusEnumDto.REQUEST
        ) {
          if (updatePurchaseDto.currency) {
            //find purchase rate
            const currency = await this.currenciesService.findOne(
              updatePurchaseDto.currency,
            );
            for (let i = 0; i < currency.currencyRate.length; i++) {
              if (currency.currencyRate[i].type == 'purchase') {
                if (currency.currencyRate[i].rate > 0) {
                  updatePurchaseDto.currencyRate = currency.latestRate;
                  break;
                }
              }
            }
          }

          updatePurchaseDto.poNumber = poNumber;

          const purchase = await this.purchaseModel.findByIdAndUpdate(
            id,
            updatePurchaseDto,
            { new: true },
          );

          if (!purchase) {
            throw new NotFoundException('Purchase not found!');
          }

          await this.createStockOperationAndStockMove(purchase);
          return await this.findOne(id);
        }
      }
    }

    await this.purchaseModel.findByIdAndUpdate(id, updatePurchaseDto, {
      new: true,
    });

    let purchaseOrder = await this.findOne(id);
    if (status == PruchaseStatusEnumDto.OPEN) {
      // console.log('hello')

      //update stock operations
      if (purchaseOrder.purchaseOrderItems) {
        //delete all stock moves and update again
        const expectedDate = new Date(
          new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        const stockOp = await this.stockOperationService.findByOrder(
          purchaseFound.poNumber,
        );

        console.log('stockOp', stockOp);

        if (stockOp) {
          await this.stockOperationService.updateOrderNo(
            stockOp._id,
            updatePurchaseDto.poNumber,
          );
          await this.stockMoveService.removeAllByOperation(stockOp._id);

          purchaseOrder.purchaseOrderItems.map(async (item) => {
            // Find product to check freight status
            const product = await this.productsService.findOneProductForWO(
              item.productId,
            );

            if (product && !product.isFreight) {
              const moveLineData = {
                productId: item.productId,
                operationId: stockOp._id,
                lineNumber: item.SN,
                lineNumberId: item._id,
                description: item.description,
                destinationId: stockOp.destination,
                estimatedDate: expectedDate,
                qty: item.qty,
                unitPrice: item.unitPrice,
                remarks: purchaseOrder.remarks,
                done: false,
                remainingQty: item.qty,
                completedQty: 0,
              };

              this.stockMoveService.createNewMove(moveLineData);
            }
          });
        } else {
          // No StockOperation Found
          // This happen when 1st update and Opened, it was only Freight item, that's why no stockOperation
          // So recreate if necessary
          await this.createStockOperationAndStockMove(purchaseOrder);
        }
      }
    }

    if (status == PruchaseStatusEnumDto.ERROR_STATUS) {
      //check if updated quantity is equal to moved quantity
      let allOk = true;
      for (let i = 0; i < purchaseOrder.purchaseOrderItems.length; i++) {
        const stockMv = await this.stockMoveService.findOneByItemId(
          purchaseOrder.purchaseOrderItems[i]._id,
        );

        if (stockMv) {
          if (stockMv.completedQty != purchaseOrder.purchaseOrderItems[i].qty) {
            //check if got child moves
            const childMv = await this.stockMoveService.findChildren(
              stockMv._id,
            );
            if (childMv.length > 0) {
              let total = stockMv.completedQty;
              for (let j = 0; j < childMv.length; j++) {
                total += childMv[j].completedQty;
              }
              if (total != purchaseOrder.purchaseOrderItems[i].qty) {
                allOk = false;
              }
            } else {
              allOk = false;
            }
          }
        }
      }
      if (allOk) {
        purchaseOrder = await this.purchaseModel.findByIdAndUpdate(
          id,
          { status: PruchaseStatusEnumDto.CLOSED },
          { new: true },
        );
      }
    }
    return purchaseOrder;
  }

  async createStockOperationAndStockMove(purchase: Purchase): Promise<boolean> {
    console.log('createStockOperationAndStockMove if any');
    // const modelName = 'Purchase'; // no longer in use as user key in PO Number manually
    const stockLocation = await this.stockLocationService.getStockByName(
      'incoming bay',
    );

    if (!stockLocation) {
      throw new NotFoundException(
        'Kindly Insert StockLocation as incoming bay',
      );
    }

    // NO USE
    // const purchaseSetting = await this.sequenceSettingsService.FindSequenceByModelName(
    //   modelName,
    // );

    const productArr = [];
    for (const purchaseItem of purchase.purchaseOrderItems) {
      // find Product to check freight status
      const product = await this.productsService.findOneProductForWO(
        purchaseItem.productId,
      );

      productArr.push(product);
    }

    const filteredPurchaseItem = productArr.filter(
      (item) => item.isFreight === false,
    );

    if (filteredPurchaseItem.length > 0) {
      // Purchase items have freight and non-freight item
      // Proceed to generate Stock Operation

      const stockSequence = await this.sequenceSettingsService.FindSequenceByModelName(
        'Stock',
      );

      const newMoveNumber = this.sequenceSettingsService.sequenceSettingEx(
        stockSequence,
      );

      await this.sequenceSettingsService.updateSequenceByModelName(
        'Stock',
        stockSequence,
      );

      const currentDate = new Date();
      const expectedDate = new Date(
        new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
      );

      const stockOperationData = {
        moveNo: newMoveNumber,
        type: 'Incoming',
        orderNo: purchase.poNumber,
        destination: stockLocation._id,
        status: OperationStatusEnumDto.OPEN,
        createdDate: currentDate,
        expectedDate: expectedDate,
      };

      const stockOperationResult = await this.stockOperationService.createNewOperation(
        stockOperationData,
      );

      // remove freight item here ========>
      purchase.purchaseOrderItems.map(async (item) => {
        // Only Accept non-Freight Item
        // Search product to find freight item
        const product = await this.productsService.findOneProductForWO(
          item.productId,
        );

        if (product && !product.isFreight) {
          const moveLineData = {
            productId: item.productId,
            operationId: stockOperationResult._id,
            lineNumber: item.SN,
            lineNumberId: item._id,
            description: item.description,
            destinationId: stockLocation._id,
            estimatedDate: expectedDate,
            qty: item.qty,
            unitPrice: item.unitPrice,
            remarks: purchase.remarks,
            done: false,
            remainingQty: item.qty,
            completedQty: 0,
          };

          await this.stockMoveService.createNewMove(moveLineData);
        }
      });

      // NO USE
      // await this.sequenceSettingsService.updateSequenceByModelName(
      //   modelName,
      //   purchaseSetting,
      // );
      return true;
    }
  }

  // Remove Single Purchase by ID
  async remove(id: string): Promise<any> {
    // find purchase by ID
    const purchaseFound = await this.purchaseModel.findOne({ _id: id }).exec();

    if (!purchaseFound) {
      throw new NotFoundException(`This purchase doesn't exist`);
    }

    const { status } = purchaseFound;
    if (status === PruchaseStatusEnumDto.CANCELLED) {
      throw new BadRequestException(
        'Puchase order has been cancelled, request denied',
      );
    }

    if (status === PruchaseStatusEnumDto.CLOSED) {
      throw new BadRequestException(
        'Puchase order has been closed, request denied',
      );
    }

    // if status is not confirmed, Proceed to Delete
    if (status !== PruchaseStatusEnumDto.OPEN) {
      console.log(
        'Let proceed to delete this purchase order as sales order is not confirmed',
      );

      // Remove Purchase Document
      await this.purchaseModel.findByIdAndRemove({
        _id: id,
      });
      return 'This purchase is successfully removed';
    }
    throw new BadRequestException(
      `Purchase order has been opened, deletion of purchase denied`,
    );
  }

  async generatePDF(id: string): Promise<any> {
    const purchaseFound = await this.purchaseModel.findById(id);

    if (!purchaseFound) {
      throw new NotFoundException('PurchaseOrder not found');
    }

    for (const poItem of purchaseFound.purchaseOrderItems) {
      const uom = await this.uomService.findOne(poItem.uom);
      if (uom) {
        poItem.uomName = uom.name;
      }
    }

    const createdDate = moment(purchaseFound.createdDate).format(
      'Do MMMM YYYY',
    );

    const delDate = moment(purchaseFound.delDate).format('Do MMMM YYYY');

    let paymentTerm: PaymentTerm,
      currency: Currency,
      purchasePic: User,
      incoterm: Incoterm;

    if (purchaseFound.paymentTerm) {
      paymentTerm = await this.paymentTermsService.findOne(
        purchaseFound.paymentTerm,
      );
    }
    if (purchaseFound.currency) {
      currency = await this.currenciesService.findOne(purchaseFound.currency);
    }

    if (purchaseFound.purchasePic) {
      purchasePic = await this.usersService.findOnePic(
        purchaseFound.purchasePic,
      );
    }

    if (purchaseFound.incoterm) {
      incoterm = await this.incotermService.findOne(purchaseFound.incoterm);
    }

    const purchase = {
      createdDate: createdDate,
      poNumber: purchaseFound.poNumber,
      suppNo: purchaseFound.suppNo,
      name: purchaseFound.name,
      address: purchaseFound.address,
      telNo: purchaseFound.telNo,
      buyerName: purchaseFound.buyerName,
      buyerEmail: purchaseFound.buyerEmail,
      faxno: purchaseFound.faxNo,
      quoRef: purchaseFound.quoRef,
      suppRef: purchaseFound.suppRef,
      delAddress: purchaseFound.delAddress,
      delDate: delDate,
      remarks: purchaseFound.remarks,
      discount: purchaseFound.discount,
      discountAmount: purchaseFound.discountAmount,
      total: purchaseFound.total,
      subTotal: purchaseFound.subTotal,
      gst: purchaseFound.gst,
      gstAmount: purchaseFound.gstAmount,
      exportLocal: purchaseFound.exportLocal,
      purchaseOrderItems: purchaseFound.purchaseOrderItems,
      purchasePicFirstName: purchasePic ? purchasePic.firstName : undefined, //pop
      purchasePicLastName: purchasePic ? purchasePic.lastName : undefined, //pop
      currency: currency ? currency.name : undefined, // pop
      currencyLatestRate: currency ? currency.latestRate : undefined, // pop
      currencySymbol: currency ? currency.symbol : undefined, // pop
      currencySymbol2: currency ? currency.currencySymbol : undefined, // pop
      paymentTermName: paymentTerm ? paymentTerm.name : undefined, // pop
      paymentTermDays: paymentTerm ? paymentTerm.days : undefined, // pop
      incoterm: incoterm ? incoterm.name : undefined, // pop
      purchaseType: purchaseFound.purchaseType,
    };

    console.log('what is purchase', purchase);
    return purchase;
  }

  async updateSimpleByAdmin(id: string, updatePurchaseDto: UpdatePurchaseDto) {
    const response = await this.purchaseModel.findByIdAndUpdate(
      id,
      updatePurchaseDto,
      { new: true },
    );
    return response;
  }

  async updateNewRemark(
    id: string,
    updatePurchaseDto: UpdatePurchaseDto,
  ): Promise<Purchase> {
    return await this.purchaseModel.findByIdAndUpdate(id, updatePurchaseDto, {
      new: true,
    });
  }

  async findAllToExportCSV() {
    const purchase = await this.purchaseModel
      .find()
      .lean()
      .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    const arr = [];
    await Promise.all(
      purchase.map(async (type) => {
        const data = {
          ...type,
          date: moment(type.updatedAt).format('DD/MM/YYYY'),
        };
        return arr.push(data);
      }),
    );
    return arr;
  }

  async findAllToExportCSVWithDate(query: any) {
    const startDate = query.startDate ? query.startDate : '';
    const endDate = query.endDate ? query.endDate : '';
    if (startDate && endDate) {
      var purchase = await this.purchaseModel
        .find({
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        })
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    } else if (startDate && !endDate) {
      var purchase = await this.purchaseModel
        .find({ createdDate: { $gte: new Date(startDate) } })
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    } else if (!startDate && endDate) {
      var purchase = await this.purchaseModel
        .find({ createdDate: { $lte: new Date(endDate) } })
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    } else {
      var purchase = await this.purchaseModel
        .find()
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    }
    const arr = [];
    await Promise.all(
      purchase.map(async (type) => {
        const data = {
          ...type,
          date: moment(type.updatedAt).format('DD/MM/YYYY'),
        };
        return arr.push(data);
      }),
    );
    return arr;
  }

  async generateAllPurchasePdf(): Promise<any> {
    const purchase = await this.purchaseModel
      .find()
      .lean()
      .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);

    return purchase;
  }

  async generateAllPurchasePdfWithDate(query: any): Promise<any> {
    const startDate = query.startDate ? query.startDate : '';
    const endDate = query.endDate ? query.endDate : '';
    if (startDate && endDate) {
      var purchase = await this.purchaseModel
        .find({
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        })
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    } else if (startDate && !endDate) {
      var purchase = await this.purchaseModel
        .find({ createdDate: { $gte: new Date(startDate) } })
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    } else if (!startDate && endDate) {
      var purchase = await this.purchaseModel
        .find({ createdDate: { $lte: new Date(endDate) } })
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    } else {
      var purchase = await this.purchaseModel
        .find()
        .lean()
        .populate(['purchasePic', 'currency', 'paymentTerm', 'incoterm']);
    }

    return purchase;
  }

  async createBySelection(
    purchaseOrderDto: CreatePurchaseBySelectionDto,
    user: User,
  ) {
    const filteredPurchaseOrderItem = purchaseOrderDto.purchaseOrderItems.filter(
      (item) => item.isChecked && !item.isPoSubmitted,
    );

    // If empty items, throw error
    if (filteredPurchaseOrderItem && filteredPurchaseOrderItem.length < 1) {
      throw new BadRequestException(
        'Not Item has been submitted, request denied',
      );
    }

    const mapFilterOutputSuppId = filteredPurchaseOrderItem
      .map((item) => item.suppId)
      .filter((value, index, self) => self.indexOf(value) === index);

    const catchRelatedSuppObj = {};
    for (const suppId of mapFilterOutputSuppId) {
      for (const item of filteredPurchaseOrderItem) {
        if (String(suppId) === String(item.suppId)) {
          catchRelatedSuppObj[item.suppId] =
            catchRelatedSuppObj[item.suppId] || [];
          catchRelatedSuppObj[item.suppId].push(item);
        }
      }
    }

    // suppProp = SuppId
    let response: Purchase;
    for (const suppProp in catchRelatedSuppObj) {
      console.log('suppProp', suppProp);
      const purchaseOrderItems = catchRelatedSuppObj[suppProp];

      // suppProp = SuppId
      for (const poItem of purchaseOrderItems) {
        const product = await this.productsService.findOneProductForWO(
          poItem.productId,
        );
        if (product) {
          poItem.unitPrice = product.unitCost;
          poItem.uom = product.uom;
          poItem.extPrice = product.unitCost * poItem.qty;
        }
      }

      const supplier = await this.supplierService.findBySupplierIdNonPopulate(
        suppProp,
      );

      if (supplier) {
        purchaseOrderDto.purchasePic = user.sub;
        purchaseOrderDto.suppNo = supplier.suppId;
        purchaseOrderDto.name = supplier.name;
        purchaseOrderDto.address = supplier.address;
        purchaseOrderDto.faxNo = supplier.fax1b;
        purchaseOrderDto.buyerName = supplier.salesPIC;
        purchaseOrderDto.buyerEmail = supplier.salesPICEmail;
        purchaseOrderDto.telNo = supplier.salesPICMobile1b;
        purchaseOrderDto.incoTerm = supplier.incoterm;
        purchaseOrderDto.delAddress = supplier.delAddress;
        purchaseOrderDto.currency = supplier.billingCurrent;
        purchaseOrderDto.discountAmount = 0;
        // suppId is supplier ref number eventually
        purchaseOrderDto.purchaseOrderItems = purchaseOrderItems;
      }

      const newPurchase = new this.purchaseModel(purchaseOrderDto);

      response = await newPurchase.save();
      console.log('Purchase Order Created');
    }

    if (response) {
      for (const poItem of filteredPurchaseOrderItem) {
        await this.purchaseListTempService.update(poItem._id, {
          isChecked: true,
          isPoSubmitted: true,
          suppName: poItem.suppName,
          suppId: poItem.suppId,
        });
      }
    } else {
      throw new BadRequestException('Failed to create purchase order');
    }
    return await this.purchaseListTempService.findAllPOListTempBySalesOrderId(
      purchaseOrderDto.salesOrderId,
    );
  }

  // Update latestPurchase value to false
  async updatePurchaseInvStatus(poNum: string, invStatus: string) {
    const purchase = await this.purchaseModel.findOne({ poNumber: poNum });
    if (purchase) {
      purchase.invStatus = invStatus;
      await purchase.save();
    }
  }

  async onCheckingPurchaseOrderItemProduct(
    ProductId: string,
  ): Promise<boolean> {
    const purchaseOrders = await this.purchaseModel.find().exec();

    if (purchaseOrders && purchaseOrders.length > 0) {
      for (const purchaseOrder of purchaseOrders) {
        const productFound = purchaseOrder.purchaseOrderItems.some(
          (item) => String(item.productId) === String(ProductId),
        );
        if (productFound) {
          throw new BadRequestException(
            'Product existed in purchase order, deletion aborted',
          );
        }
      }
    }
    return true;
  }
}
