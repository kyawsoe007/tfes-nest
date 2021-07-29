import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  DeliveryOrder,
  DeliveryOrderObject,
  DeliveryStatusEnum,
  DeliveryLines,
  DeliveryLineStatusEnum,
} from './delivery-orders.interface';

import * as moment from 'moment';

import { UpdateAllDeliveryOrderDto } from './dto/update-all-delivery-order.dto';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { SequenceSettingsService } from '../sequence-settings/sequence-settings.service';
import { PackingListsService } from '../packing-lists/packing-lists.service';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto';
import { WorkOrdersService } from '../work-orders/work-orders.service';

import { User } from '../users/users.interface';
import { UsersService } from '../users/users.service';
import { UomService } from '../uom/uom.service';
import modifySequenceNumber from '../shared/modifySequence';
import { DeliveryWorkItemsService } from '../delivery-work-items/delivery-work-items.service';
import { CreateDeliveryWorkItemDto } from '../delivery-work-items/dto/create-delivery-work-items.dto';
import { UpdateDeliveryWorkItemDto } from '../delivery-work-items/dto/update-delivery-work-items.dto';
import { IncotermService } from '../incoterm/incoterm.service';
import { Incoterm } from '../incoterm/incoterm.interface';
import { SaleOrderItemsDto } from '../sales-orders/dto/create-sales-order.dto';
import { UpdateDeliveryOrderDto } from './dto/update-delivery-order.dto';

@Injectable()
export class DeliveryOrdersService {
  constructor(
    @InjectModel('DeliveryOrder')
    private readonly deliveryOrderModel: Model<DeliveryOrder>,
    @Inject(forwardRef(() => SalesOrdersService))
    private readonly salesOrdersService: SalesOrdersService,
    private readonly sequenceSettingsService: SequenceSettingsService,
    @Inject(forwardRef(() => PackingListsService))
    private readonly packingListsService: PackingListsService,
    @Inject(forwardRef(() => WorkOrdersService))
    private readonly workOrdersService: WorkOrdersService,
    private readonly usersService: UsersService,
    private readonly uomService: UomService,
    private readonly deliveryWorkItemsService: DeliveryWorkItemsService,
    private readonly incotermService: IncotermService,
  ) {}

  async createNewBasedSelection(
    createDeliveryOrderDto: CreateDeliveryOrderDto,
  ): Promise<DeliveryOrder> {
    console.log('createDeliveryOrderDto', createDeliveryOrderDto);
    // const modelName = 'DeliveryOrder'; // hard-coded first

    // find SalesOrder to get Customer Id & SoNumber
    const salesOrder = await this.salesOrdersService.getSalesOrder(
      createDeliveryOrderDto.orderId,
    );

    if (!salesOrder) {
      throw new NotFoundException(
        'sales order not found while creating delivery, request denied',
      );
    }

    //const delivery = await this.findOneDeliverOrderByOrderId(salesOrder._id);
    const modelName = 'SalesOrder'; // hard-coded first
    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    const replaceChar = 'D';
    const toIncrement = true;
    const deliveryNum = modifySequenceNumber(
      salesOrder.soNumber,
      salesOrder.doCount,
      replaceChar,
      toIncrement,
      settings.prefix,
    );

    if (salesOrder) {
      salesOrder.doCount = deliveryNum.newCountNum;
      await salesOrder.save();
    }

    const workOrder = await this.workOrdersService.findWorkOrderBySalesOrderId(
      createDeliveryOrderDto.orderId,
    );

    if (!workOrder) {
      throw new NotFoundException('workorder not found');
    }

    const deliveryLines = [];
    // const action = OnActionEnum.ONCREATE;
    const status = DeliveryLineStatusEnum.Open;

    if (createDeliveryOrderDto.deliveryLines) {
      let deliveryLineNum = 0;
      for (const item of createDeliveryOrderDto.deliveryLines) {
        deliveryLineNum++;
        // await this.workOrdersService.updateWorkOrderItemStatusFromDO(
        //   workOrder._id,
        //   item._id,
        //   status,
        //   action,
        // );

        const uom = await this.uomService.findOne(item.uom);

        const deliveryLine: DeliveryLines = {
          deliveryLineNum: deliveryLineNum,
          qty: item.balanceQty,
          sku: item.sku || undefined,
          productId: item.productId || undefined,
          deliveryLinesStatus: DeliveryLineStatusEnum.Open,
          woItemId: item.woItemId,
          description: item.description,
          bom: item.bom || undefined,
          uom: uom ? uom.name : undefined,
        };

        deliveryLines.push(deliveryLine);
      }
    }

    console.log('Proceed in saving DeliveryOrder');

    let incoterm: Incoterm;
    if (salesOrder.incoterm) {
      incoterm = await this.incotermService.findOne(salesOrder.incoterm);
    }
    const incoTerm = incoterm ? incoterm.name : undefined;
    const soDelRemarkReformat = incoTerm
      ? `${incoTerm}\n${salesOrder.deliveryRemark}`
      : `${salesOrder.deliveryRemark}`;

    const deliveryOrderObject: DeliveryOrderObject = {
      orderId: createDeliveryOrderDto.orderId,
      deliveryAddress: salesOrder.delAddress,
      soDelRemark: soDelRemarkReformat,
      deliveryLines: deliveryLines,
      customerId: salesOrder.custId,
      deliveryNumber: deliveryNum.newSequenceValue,
      workOrderId: workOrder._id,
      ciplNum: deliveryNum.ciplNum,
      soNumber: salesOrder.soNumber, // check if exist
    };

    const newDeliveryOrder = new this.deliveryOrderModel(deliveryOrderObject);

    // 3.SAVE NEW WORKORDER
    const savedDeliverOrder = await newDeliveryOrder.save();

    if (!savedDeliverOrder) {
      throw new InternalServerErrorException('Failed to save Delivery Order!');
    }

    // Create DeliveryWoItem
    for (const item of createDeliveryOrderDto.deliveryLines) {
      const createDeliveryWorkItemDto: CreateDeliveryWorkItemDto = {
        qty: item.balanceQty, // this is balanceQty
        workOrderId: workOrder._id,
        woItemId: item.woItemId,
        deliveryId: savedDeliverOrder._id,
        initialQty: item.latestQtyInput,
        isClosed: undefined,
        partialCount: item.partialCount,
      };

      await this.deliveryWorkItemsService.createDeliveryWoItems(
        createDeliveryWorkItemDto,
      );
    }

    // Create Packing List
    await this.packingListsService.createPackingList(savedDeliverOrder._id);

    // Update doStatus in salesorder
    await this.salesOrdersService.updateDoStatus(
      savedDeliverOrder.orderId,
      DeliveryStatusEnum.Partial,
    );

    return savedDeliverOrder;
  }

  async updateAllDeliverOrder(
    id: string,
    updateAllDeliveryOrderDto: UpdateAllDeliveryOrderDto,
  ): Promise<DeliveryOrder> {
    const deliveryOrder = await this.deliveryOrderModel.findById(id);

    if (!deliveryOrder) {
      throw new NotFoundException('Delivery Order Not Found, Request Denied');
    }

    const doItemCheck = [];

    // const action = OnActionEnum.ONUPDATE;
    // let status: DeliveryLineStatusEnum;

    for (const item of updateAllDeliveryOrderDto.deliveryLines) {
      if (item.qty === item.deliveryQty) {
        item.deliveryLinesStatus = DeliveryLineStatusEnum.Completed;
      }
      if (item.deliveryQty > 0 && item.qty !== item.deliveryQty) {
        item.deliveryLinesStatus = DeliveryLineStatusEnum.Partial;
      }

      // status = item.deliveryLinesStatus;

      // await this.workOrdersService.updateWorkOrderItemStatusFromDO(
      //   deliveryOrder.workOrderId,
      //   item.woItemId,
      //   status,
      //   action,
      // );

      if (item.deliveryLinesStatus !== DeliveryLineStatusEnum.Completed) {
        doItemCheck.push(item.deliveryLinesStatus);
      }
    }

    if (deliveryOrder.deliveryStatus === DeliveryStatusEnum.Draft) {
      if (updateAllDeliveryOrderDto.deliveryDate) {
        updateAllDeliveryOrderDto.deliveryStatus = DeliveryStatusEnum.Confirmed;

        // Update doStatus in salesorder
        // await this.salesOrdersService.updateDoStatus(
        //   deliveryOrder.orderId,
        //   DeliveryStatusEnum.Partial,
        // );

        // Create Stock Operation
        // this.stockOperationService.createOutgoingStockMove(deliveryOrder._id);
      }
    }

    //if empty array of inCompleteStatus, set deliveryStatus = 'completed
    if (doItemCheck && doItemCheck.length < 1) {
      // update Delivery Status to closed
      updateAllDeliveryOrderDto.deliveryStatus = DeliveryStatusEnum.Closed;

      const updateDeliveryWorkItemDto: UpdateDeliveryWorkItemDto = {
        isClosed: true,
      };

      // Update isClosed: true for DeliveryWoItem
      await this.deliveryWorkItemsService.updateManyDeliveryWoItemsByDeliveryId(
        deliveryOrder._id,
        updateDeliveryWorkItemDto,
      );

      // Check and Update SalesOrder Status or Do Status ! Important
      await this.workOrdersService.updateDoStatusAndSoStatus(
        deliveryOrder.orderId,
      );
    } else {
      const isPartial = doItemCheck.some(
        (doItemStatus) => doItemStatus === DeliveryStatusEnum.Partial,
      );

      if (isPartial) {
        // update Delivery Status to Partial
        updateAllDeliveryOrderDto.deliveryStatus = DeliveryStatusEnum.Partial;
      }
    }

    await this.deliveryOrderModel.findByIdAndUpdate(
      id,
      updateAllDeliveryOrderDto,
      { new: true },
    );

    return this.findOneDeliveryOrder(id);
  }

  // Temporary no use
  async updateWorkOrderItemStatus(
    workOrderId: string,
    deliveryOrderId: string,
  ) {
    const deliveryOrder = await this.deliveryOrderModel.findById(
      deliveryOrderId,
    );

    if (!deliveryOrder) {
      throw new NotFoundException('Deliver order no found');
    }

    // iterate to update item status
    // const action = OnActionEnum.ONUPDATE;
    // for (const item of deliveryOrder.deliveryLines) {
    //   await this.workOrdersService.updateWorkOrderItemStatusFromDO(
    //     workOrderId,
    //     item.woItemId,
    //     item.deliveryLinesStatus,
    //     action,
    //   );
    // }
  }

  async findAllDeliveryOrder(): Promise<DeliveryOrder[]> {
    const deliveryOrders = await this.deliveryOrderModel
      .find(
        {},
        'deliveryNumber orderId timeRange deliveryDate customerId deliveryAddress deliveryStatus',
      )
      .exec();

    // await Promise.all(
    //   deliveryOrders.map(async (prop) => {
    //     const salesOrder = await this.salesOrdersService.getSalesOrder(
    //       prop.orderId,
    //     );
    //     prop.set('soNumber', salesOrder.soNumber, {
    //       strict: false,
    //     });
    //     prop.set('customer', salesOrder.custName, {
    //       strict: false,
    //     });
    //   }),
    // );

    return deliveryOrders;
  }

  async findOneDeliveryOrder(id: string): Promise<DeliveryOrder> {
    const deliveryOrder = await this.deliveryOrderModel.findById(id);

    if (!deliveryOrder) {
      throw new NotFoundException('Delivery Order Does Not Exist');
    }
    //find the sale order id
    const saleOrder = await this.salesOrdersService.getSalesOrder(
      deliveryOrder.orderId,
    );

    if (!saleOrder) {
      throw new NotFoundException('No values from Sales Order');
    }

    // deliveryOrder.set('soNumber', saleOrder.soNumber, { strict: false });
    deliveryOrder.set('custName', saleOrder.custName, {
      strict: false,
    });
    deliveryOrder.set('delAddress', saleOrder.delAddress, {
      strict: false,
    });
    if (!deliveryOrder) {
      throw new NotFoundException(`This deliveryOrder doesn't exist`);
    }

    return deliveryOrder;
  }

  // REMOVE DELIVERYORDER WILL REMOVE DELIVERY WORK ITEM DOCUMENTS AND PACKING DOCUMENT
  async removeDeliveryOrder(doId: string): Promise<any> {
    const deliveryOrder = await this.findSimpleDeliveryOrderById(doId);
    if (!deliveryOrder) {
      throw new NotFoundException('Delivery Order not found, reset aborted');
    }
    const response = await this.deliveryOrderModel.findByIdAndRemove(doId);
    await this.deliveryWorkItemsService.removeAllDoWorkItemsByDoId(doId);
    await this.workOrdersService.updateDoStatusWoItemAfterMediumReset(
      deliveryOrder.workOrderId,
    );
    await this.packingListsService.removeAllDoWorkItemsByDoId(doId);
    return response;
  }

  async findSimpleDeliveryOrderById(id: string): Promise<DeliveryOrder> {
    const deliveryOrder = await this.deliveryOrderModel.findById(id);

    if (!deliveryOrder) {
      throw new NotFoundException(
        `This deliveryOrder doesn't exist, message in findSimpleDeliveryOrderById`,
      );
    }

    return deliveryOrder;
  }

  async findOneDeliverOrderByOrderId(orderId: string): Promise<DeliveryOrder> {
    const deliveryOrder = await this.deliveryOrderModel.findOne({
      orderId: orderId,
    });

    return deliveryOrder;
  }

  async getFilters(query) {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
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
        if (property === 'deliveryStatus') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              namedFilter.push({ deliveryStatus: { $in: propVal } });
            } else {
              namedFilter.push({ deliveryStatus: propVal });
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
          { deliveryNumber: searchPattern }, // deliveryNumber
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

    const deliveryOrders = await this.deliveryOrderModel
      .find(where)
      .skip(skip)
      .limit(limit)
      .sort(orderBy);

    for (const item of deliveryOrders) {
      const salesOrder = await this.salesOrdersService.getSalesOrder(
        item.orderId,
      );

      if (salesOrder) {
        item.set('custName', salesOrder.custName, {
          strict: false,
        });
      }
    }

    const count = await this.deliveryOrderModel.countDocuments(where);
    return [deliveryOrders, count];
  }

  async updateDeliverOrderById(
    id: string,
    updateDeliveryOrderDto: UpdateDeliveryOrderDto,
  ): Promise<DeliveryOrder> {
    const response = await this.deliveryOrderModel.findByIdAndUpdate(
      id,
      updateDeliveryOrderDto,
      { new: true },
    );
    return response;
  }

  async generatePdf(id: string): Promise<any> {
    const deliveryOrder = await this.deliveryOrderModel.findById(id);

    console.log('deliveryOrder', deliveryOrder);

    if (!deliveryOrder) {
      throw new NotFoundException('DeliveryOrder not found');
    }

    const salesOrder = await this.salesOrdersService.getSalesOrder(
      deliveryOrder.orderId,
    );

    // example to show
    for (const doItem of deliveryOrder.deliveryLines) {
      const isMatched = salesOrder.salesOrderItems.find(
        (soItem: SaleOrderItemsDto) => soItem._id.toString() == doItem.woItemId,
      );

      doItem.custRef = isMatched ? isMatched.custRef : undefined;
    }

    let salesPic: User;
    //paymentTerm: PaymentTerm;

    if (salesOrder.salesPic) {
      salesPic = await this.usersService.findOnePic(salesOrder.salesPic);
    }

    // if (salesOrder.paymentTerm) {
    //   paymentTerm = await this.paymentTermsService.findOne(
    //     salesOrder.paymentTerm,
    //   );
    // }

    const deliveryDate = moment(deliveryOrder.deliveryDate).format(
      'Do MMMM YYYY',
    );

    const deliveryPayLoad = {
      deliveryDate: deliveryDate,
      deliveryNumber: deliveryOrder.deliveryNumber,
      delAddress: deliveryOrder.deliveryAddress,
      soDelRemark: deliveryOrder ? deliveryOrder.soDelRemark : '',
      custName: salesOrder.custName,
      custPic: salesOrder.buyerName,
      custTel: salesOrder.telNo,
      custEmail: salesOrder.buyerEmail,
      custNo: salesOrder.custNo,
      custPoNum: salesOrder.custPoNum,
      custAddress: salesOrder.address,
      // paymentTerm: salesOrder.paymentTerm,
      soNumber: deliveryOrder.soNumber,
      deliveryRemark: deliveryOrder.remark,
      timeDelivery: deliveryOrder.timeDelivery,
      driver: deliveryOrder.driver,
      deliveryLines: deliveryOrder.deliveryLines,
      salesPicFirstname: salesPic ? salesPic.firstName : undefined, // pop
      salesPicLastName: salesPic ? salesPic.lastName : undefined, // pop
      // paymentTermName: paymentTerm ? paymentTerm.name : undefined, // pop
      // paymentTermDays: paymentTerm ? paymentTerm.days : undefined, // pop
      ciplNum: salesOrder.ciplNum,
    };

    console.log('payload', deliveryPayLoad);

    return deliveryPayLoad;
  }

  async removeAllDoByWoId(woId: string): Promise<any> {
    const response = await this.deliveryOrderModel.deleteMany({
      workOrderId: woId,
    });
    console.log('Do Items Removed if any', response);

    return response;
  }

  async findAllDeliverOrderByWoId(woId: string): Promise<DeliveryOrder[]> {
    const deliveryOrder = await this.deliveryOrderModel.find({
      workOrderId: woId,
    });

    return deliveryOrder;
  }
}
