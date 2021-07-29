import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PackingList, PackinglistStatus } from './packing-lists.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SequenceSettingsService } from '../sequence-settings/sequence-settings.service';
import { SkusService } from '../skus/skus.service';
import { ProductsService } from '../products/products.service';
import { WorkOrderPickingsService } from '../work-order-pickings/work-order-pickings.service';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import { StockOperationService } from '../stock-operation/stock-operation.service';
import { StockMoveService } from '../stock-move/stock-move.service';

import { UpdatePackingListDto } from './dto/update-packing-list.dto';
import { DeliveryOrdersService } from '../delivery-orders/delivery-orders.service';

import {
  CreatePackingListDto,
  PackItemsDto,
  PackItemStatus,
} from './dto/create-packing-list.dto';
import modifySequenceNumber from '../shared/modifySequence';
import { UsersService } from '../users/users.service';
import { User } from '../users/users.interface';
import * as moment from 'moment';
import { IncotermService } from '../incoterm/incoterm.service';
import { Incoterm } from '../incoterm/incoterm.interface';
import { CurrenciesService } from '../currencies/currencies.service';
import { Currency } from '../currencies/currencies.interface';

@Injectable()
export class PackingListsService {
  constructor(
    @InjectModel('PackingList')
    private readonly packingListModel: Model<PackingList>,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    @Inject(forwardRef(() => SalesOrdersService))
    private salesOrdersService: SalesOrdersService,
    private readonly deliveryOrdersService: DeliveryOrdersService,
    private readonly usersService: UsersService,
    private readonly incotermService: IncotermService,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async createPackingList(deliveryId: string): Promise<PackingList> {
    // 1. Check if PackingList exsistance
    const packingList = await this.packingListModel.findOne({
      deliveryId: deliveryId,
    });

    if (packingList) {
      throw new BadRequestException(
        `This PackingLlist was already existed, creating new Packing Order is denied`,
      );
    }

    const deliveryOrder = await this.deliveryOrdersService.findSimpleDeliveryOrderById(
      deliveryId,
    );

    const salesOrder = await this.salesOrdersService.getSalesOrder(
      deliveryOrder.orderId,
    );

    console.log('Proceed in creating Packing Number');
    //const modelName = 'PackingList';

    const initialCount = undefined;
    const replaceChar = 'PL';
    const toIncrement = false;
    const prefix = 'D';
    const PackingNum = modifySequenceNumber(
      deliveryOrder.deliveryNumber,
      initialCount,
      replaceChar,
      toIncrement,
      prefix,
    );

    console.log('Proceed in creating PackListing');

    const packItems = [];

    let numIncrement = 0;
    for (const deliveryItem of deliveryOrder.deliveryLines) {
      numIncrement++;

      // If bom , find new generated sku
      const packItem: PackItemsDto = {
        workItemId: deliveryItem.woItemId,
        runningNum: numIncrement,
        qty: deliveryItem.qty,
        productId: deliveryItem.productId,
        uom: deliveryItem.uom,
        packItemStatus: PackItemStatus.OPEN,
        sku: undefined, // use product Id for now
        container: undefined,
        weight: undefined,
        measurement: undefined,
        hsCode: undefined,
        cooCode: undefined,
      };
      packItems.push(packItem);
    }

    let incoterm: Incoterm;
    if (salesOrder.incoterm) {
      incoterm = await this.incotermService.findOne(salesOrder.incoterm);
    }
    const incoTerm = incoterm ? incoterm.name : null;

    const soDelRemarkReformat = incoTerm
      ? `${incoTerm}\n${salesOrder.deliveryRemark}`
      : `${salesOrder.deliveryRemark}`;

    const packingListPayload: CreatePackingListDto = {
      // packingNum: newPackingNum,
      packingNum: PackingNum.newSequenceValue,
      orderId: deliveryOrder.orderId,
      deliveryId: deliveryOrder._id,
      workOrderId: deliveryOrder.workOrderId,
      packItems: packItems,
      operationId: undefined,
      pickedBy: undefined,
      packinglistStatus: undefined,
      hsCode: undefined,
      cooCode: undefined,
      packagingType: undefined,
      completedDate: undefined,
      remark: undefined,
      soDelRemark: soDelRemarkReformat,
      soNumber: deliveryOrder.soNumber,
    };
    const response = new this.packingListModel(packingListPayload);

    return await response.save();
  }

  async findOnePackingList(packingId: string): Promise<PackingList> {
    const packingLists = await this.getLeanPackingOrderById(packingId);

    if (!packingLists) {
      throw new NotFoundException(`Packing doesn't exist`);
    }

    const salesOrder = await this.salesOrdersService.getSalesOrder(
      packingLists.orderId,
    );

    if (!salesOrder) {
      throw new NotFoundException('No values from Sales Order');
    }

    for (const packListing of packingLists.packItems) {
      // get product by product id
      const product = await this.productsService.findOneProductForWO(
        packListing.productId,
      );

      if (product) {
        packListing.set('product', product, { strict: false });
      }

      packingLists.set('customer', salesOrder.custName, {
        strict: false,
      });
    }
    return packingLists;
  }

  async update(
    id: string,
    updatePackingListDto: UpdatePackingListDto,
  ): Promise<PackingList> {
    const packingLists = await this.packingListModel.findOne({ _id: id });
    if (!packingLists) {
      throw new NotFoundException('Packing List Does Not Exist');
    }

    console.log(updatePackingListDto);

    if (packingLists.packinglistStatus === PackinglistStatus.COMPLETED) {
      // throw new BadRequestException(
      //   'Packing list was completed, request denied',
      // );
    }

    const inPendingItem = [];
    for (const item of updatePackingListDto.packItems) {
      if (item.container && item.measurement) {
        item.packItemStatus = PackItemStatus.COMPLETED;
      }
      if (item.packItemStatus !== PackItemStatus.COMPLETED) {
        inPendingItem.push(item.packItemStatus);
      }
    }
    if (inPendingItem && inPendingItem.length < 1) {
      updatePackingListDto.packinglistStatus = PackinglistStatus.COMPLETED;
    } else {
      updatePackingListDto.packinglistStatus = PackinglistStatus.PROCESSING;
    }

    const updatedPackingList = await this.packingListModel.findByIdAndUpdate(
      id,
      updatePackingListDto,
      { new: true },
    );
    console.log('updatedPackingList', updatedPackingList);
    return updatedPackingList;
  }

  async getPackingOrderByOrderId(orderId: string): Promise<PackingList> {
    const packingOrder = await this.packingListModel.findOne({
      orderId: orderId,
    });

    return packingOrder;
  }

  async getLeanPackingOrderById(packingId: string): Promise<PackingList> {
    return await this.packingListModel.findById(packingId);
  }

  async findByWoId(woId: string): Promise<PackingList> {
    return await this.packingListModel.findOne({ workOrderId: woId });
  }

  async findByDoId(doId: string): Promise<PackingList> {
    return await this.packingListModel.findOne({ deliveryId: doId });
  }

  async findAllPackingList(): Promise<PackingList[]> {
    const packingList = await this.packingListModel
      .find({}, 'packingNum orderId createDate packinglistStatus')
      .exec();

    // await Promise.all(
    //   packingList.map(async (prop) => {
    //     const salesOrder = await this.salesOrdersService.getSalesOrder(
    //       prop.orderId,
    //     );

    //     if (!salesOrder) {
    //       throw new NotFoundException(
    //         'Some salesorder not found, unable to display PackingList',
    //       );
    //     }
    //     // prop.soNumber = salesOrder.soNumber;
    //     prop.set('soNumber', salesOrder.soNumber, {
    //       strict: false,
    //     });
    //   }),
    // );
    return packingList;
  }

  async remove(id: string): Promise<PackingList> {
    const deletedPackingList = await this.packingListModel.findByIdAndRemove(
      id,
    );
    return deletedPackingList;
  }

  async getFilters(query) {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    // const orderBy = query.orderBy ? query.orderBy : { createdAt: -1 };
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { createdAt: -1 };

    let where = {};
    const namedFilter = [];

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];
        if (property === 'packinglistStatus') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              namedFilter.push({ packinglistStatus: { $in: propVal } });
            } else {
              namedFilter.push({ packinglistStatus: propVal });
            }
          }
        }
      }
    }
    if (namedFilter.length == 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }

    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { packingNum: searchPattern }, // packingNum
          { soNumber: searchPattern }, // soNumber
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

    const packingList = await this.packingListModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy);

    // await Promise.all(
    //   packingList.map(async (prop) => {
    //     const salesOrder = await this.salesOrdersService.getSalesOrder(
    //       prop.orderId,
    //     );
    //     if (!salesOrder) {
    //       throw new NotFoundException(
    //         'Some SalesOrder not found while listing Packing List ',
    //       );
    //     }
    //     // prop.soNumber = salesOrder.soNumber;
    //     prop.set('soNumber', salesOrder.soNumber, {
    //       strict: false,
    //     });
    //   }),
    // );

    const count = await this.packingListModel.countDocuments(where);
    return [packingList, count];
  }

  async generatePDF(id: string): Promise<any> {
    const packingList = await this.packingListModel.findById({ _id: id });

    if (!packingList) {
      throw new NotFoundException('Packing List not Found');
    }

    const deliveryOrder = await this.deliveryOrdersService.findSimpleDeliveryOrderById(
      packingList.deliveryId,
    );
    const salesOrder = await this.salesOrdersService.getSalesOrder(
      packingList.orderId,
    );

    let salesPic: User;
    if (salesOrder.salesPic) {
      salesPic = await this.usersService.findOnePic(salesOrder.salesPic);
    }

    for (const item of packingList.packItems) {
      const product = await this.productsService.findOneProductForWO(
        item.productId,
      );
      console.log('what is item', item);

      const isMatched = salesOrder.salesOrderItems.find(
        (soItem) => String(soItem._id) == String(item.workItemId),
      );

      item.custRef = isMatched ? isMatched.custRef : undefined;
      item.description = product.description;
    }

    const completedDate = moment(packingList.completedDate).format(
      'Do MMMM YYYY',
    );

    const createdAt = moment(packingList.createdAt).format('Do MMMM YYYY');

    const newPackingList = {
      soNumber: salesOrder.soNumber,
      custName: salesOrder.custName,
      custPic: salesOrder.buyerName,
      custTel: salesOrder.telNo,
      custEmail: salesOrder.buyerEmail,
      custNo: salesOrder.custNo,
      custPoNum: salesOrder.custPoNum,
      custAddress: salesOrder.address,
      pickedBy: packingList.pickedBy,
      address: salesOrder.address,
      poNumber: salesOrder.poNumber,
      packItems: packingList.packItems,
      packingNum: packingList.packingNum,
      buyerName: salesOrder.buyerName,
      hsCode: packingList.hsCode,
      cooCode: packingList.cooCode,
      deliveryRemark: deliveryOrder.remark,
      delAddress: deliveryOrder.deliveryAddress,
      soDelRemark: packingList.soDelRemark,
      salesPicFirstname: salesPic.firstName,
      salesPicLastname: salesPic.lastName,
      completedDate: completedDate,
      createdAt: createdAt,
      ciplNum: deliveryOrder.ciplNum,
      remark: packingList.remark,
      packagingType: packingList.packagingType,
    };

    return newPackingList;
  }

  async getCommercialInvoicePdf(id: string) {
    const packingList = await this.packingListModel.findById(id);
    packingList.packItems.sort((a, b) => {
      if (a.runningNum > b.runningNum) return 1;
      else if (a.runningNum < b.runningNum) return -1;
      else return 0;
    });

    const deliveryOrder = await this.deliveryOrdersService.findSimpleDeliveryOrderById(
      packingList.deliveryId,
    );
    const salesOrder = await this.salesOrdersService.getSalesOrder(
      packingList.orderId,
    );

    let salesPic: User, currency: Currency;

    // get salesPic
    if (salesOrder.salesPic) {
      salesPic = await this.usersService.findOnePic(salesOrder.salesPic);
    }

    // get currency name
    if (salesOrder.currency) {
      currency = await this.currenciesService.findOne(salesOrder.currency);
    }

    let subTotal = 0;
    for (const item of packingList.packItems) {
      const product = await this.productsService.findOneProductForWO(
        item.productId,
      );
      const isMatched = salesOrder.salesOrderItems.find(
        (soItem) => soItem._id.toString() == item.workItemId,
      );

      // calculate extPrice of each item
      const extPriceItem = isMatched ? item.qty * isMatched.unitPrice : 0;

      // calculate sub total
      subTotal += extPriceItem;

      item.extPrice = extPriceItem; // use this for report
      item.unitPrice = isMatched ? isMatched.unitPrice : 0; // use this for report
      item.custRef = isMatched ? isMatched.custRef : undefined; // use this for report
      item.description = product.description; // uuse this for report
    }

    // Get Grand Total
    let grandTotal = 0;
    if (salesOrder.gstAmt && salesOrder.gstAmt !== 0) {
      grandTotal = subTotal + salesOrder.gstAmt;
    } else {
      grandTotal = subTotal;
    }

    const completedDate = moment(packingList.completedDate).format(
      'Do MMMM YYYY',
    );

    const createdAt = moment(packingList.createdAt).format('Do MMMM YYYY');

    const newPackingList = {
      soNumber: salesOrder.soNumber,
      custName: salesOrder.custName,
      custPic: salesOrder.buyerName,
      custTel: salesOrder.telNo,
      custEmail: salesOrder.buyerEmail,
      custNo: salesOrder.custNo,
      custPoNum: salesOrder.custPoNum,
      custAddress: salesOrder.address,
      pickedBy: packingList.pickedBy,
      address: salesOrder.address,
      poNumber: salesOrder.poNumber,
      packItems: packingList.packItems,
      packingNum: packingList.packingNum,
      buyerName: salesOrder.buyerName,
      hsCode: packingList.hsCode,
      cooCode: packingList.cooCode,
      deliveryRemark: deliveryOrder.remark,
      delAddress: deliveryOrder.deliveryAddress,
      soDelRemark: packingList.soDelRemark,
      salesPicFirstname: salesPic.firstName,
      salesPicLastname: salesPic.lastName,
      completedDate: completedDate,
      ciplNum: deliveryOrder.ciplNum,
      remark: packingList.remark,
      packagingType: packingList.packagingType,
      createdAt: createdAt,
      subTotal: subTotal,
      grandTotal: grandTotal,
      currencyName: currency ? currency.name : undefined,
      gstAmt: salesOrder.gstAmt,
    };

    console.log('what is newPackingList', newPackingList);

    return newPackingList;
  }

  async removeAllPackingListByWoId(woId: string): Promise<any> {
    const response = await this.packingListModel.deleteMany({
      workOrderId: woId,
    });

    console.log('PackingList Removed if any', response);

    return response;
  }

  async removeAllDoWorkItemsByDoId(doId: string): Promise<any> {
    const response = await this.packingListModel.deleteMany({
      deliveryId: doId,
    });

    console.log('PackingList Items Removed if any', response);
    return response;
  }
}
