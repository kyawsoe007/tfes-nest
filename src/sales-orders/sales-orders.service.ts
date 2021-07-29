import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as moment from 'moment';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BomsService } from '../boms/boms.service';
import { CurrenciesService } from '../currencies/currencies.service';
import { DiscountsService } from '../discounts/discounts.service';
import { IncotermService } from '../incoterm/incoterm.service';
import { PaymentTermsService } from '../payment-terms/payment-terms.service';
import { ProductsService } from '../products/products.service';
import { PurchasesService } from '../purchase-order/purchase-order.service';
import { QuotationsService } from '../quotations/quotations.service';
import { SequenceSettingsService } from '../sequence-settings/sequence-settings.service';
import { FilterDto } from '../shared/filter.dto';
import { SkusService } from '../skus/skus.service';
import { StockLocationService } from '../stock-location/stock-location.service';
import { TaxesService } from '../taxes/taxes.service';
import { UomService } from '../uom/uom.service';
import { User } from '../users/users.interface';
import { UsersService } from '../users/users.service';
import { WoStatusEnum } from '../work-orders/interfaces/work-orders.interface';
import { WorkOrdersService } from '../work-orders/work-orders.service';
import {
  CreateSalesOrderDto,
  SaleOrderItemsDto,
  SalesStatusEnumDto,
} from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';

import {
  SalesOrder,
  QuotationConvert,
} from './interfaces/sales-orders.interface';
import { PaymentTerm } from '../payment-terms/interfaces/payment-terms.interface';
import { Currency } from '../currencies/currencies.interface';
import { Incoterm } from '../incoterm/incoterm.interface';
import { Product } from '../products/products.interface';
import { typeOfCurrency } from '../currencies/dto/create-currency.dto';
import orderCalculation from '../shared/orderCalculation';
import modifySequenceNumber from '../shared/modifySequence';
import { WorkOrderPickingsService } from '../work-order-pickings/work-order-pickings.service';
import { CreatePurchaseListTempDto } from '../purchase-list-temp/dto/create-purchase-list-temp.dto';
import { PurchaseListTempService } from '../purchase-list-temp/purchase-list-temp.service';
import { PurchaseListTemp } from '../purchase-list-temp/purchase-list-temp.interface';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectModel('SalesOrder')
    private readonly salesOrderModel: Model<SalesOrder>,
    private readonly taxesService: TaxesService,
    private readonly currenciesService: CurrenciesService,
    private readonly incotermService: IncotermService,
    private readonly paymentTermsService: PaymentTermsService,
    private readonly sequenceSettingsService: SequenceSettingsService,
    private readonly bomsService: BomsService,
    private readonly skusService: SkusService,
    private readonly productsService: ProductsService,
    private readonly quotationsService: QuotationsService,
    private readonly discountsService: DiscountsService,
    private readonly workOrdersService: WorkOrdersService,
    private readonly usersService: UsersService,
    private readonly uomService: UomService,
    private readonly purchasesService: PurchasesService,
    private readonly stockLocationService: StockLocationService,
    private readonly workOrderPickingsService: WorkOrderPickingsService,
    private readonly purchaseListTempService: PurchaseListTempService,
    private readonly invoicesService: InvoicesService,
  ) {}

  checkBomDuplicate(salesOrderItems) {
    const bomObject = {};
    const descObject = {};
    const joinLineItemArr = [];

    // Collect BOM Duplicate
    salesOrderItems.forEach((item: { bom: string }) => {
      if (item.bom) {
        bomObject[item.bom] = bomObject[item.bom] || [];
        bomObject[item.bom].push(item);
      }
    });

    // Collect Description Duplicate
    for (const bomProp in bomObject) {
      if (bomObject[bomProp].length > 1) {
        const dupBomObject = bomObject[bomProp];
        dupBomObject.forEach((item: { description: string }) => {
          descObject[item.description] = descObject[item.description] || [];
          descObject[item.description].push(item);
        });
      }
    }

    // Join SN to console.log
    for (const descProp in descObject) {
      if (descObject[descProp].length > 1) {
        const descriptionArr = descObject[descProp];
        // const lineItem = descriptionArr.reduce(
        //   (a: { SN: number }, b: { SN: number }) => a.SN + ', ' + b.SN,
        // );
        const lineItem = descriptionArr.reduce((a: { SN: number }) => a.SN);
        joinLineItemArr.push({ lineItem });
      }
    }

    // Throw error if any
    if (joinLineItemArr && joinLineItemArr.length > 0) {
      joinLineItemArr.forEach((item) => {
        throw new BadRequestException(
          // `Item No: ${item.lineItem} has duplication of BOM description among line items`,
          'Sales order lines has duplication of BOM description',
        );
      });
    }
  }

  // Create New Sales Order
  async createNewSalesOrder(
    createSalesOrderDto: CreateSalesOrderDto,
  ): Promise<SalesOrder> {
    if (!createSalesOrderDto.custId) {
      throw new BadRequestException(
        'Customer has not selected, kindly select or create new customer',
      );
    }

    console.log('createSalesOrderDto', createSalesOrderDto);

    // Check if input comes with quotation Id
    // If quotation was locked, saving new sales Order is forbidden
    if (createSalesOrderDto.quotation) {
      await this.quotationsService.findStatusById(
        createSalesOrderDto.quotation,
      );
    }

    // const salesOrderItems = createSalesOrderDto.salesOrderItems;

    const salesOrderItems = createSalesOrderDto.salesOrderItems.filter(
      (item) => {
        return (
          item.sku ||
          item.productId ||
          (item.BomList && item.BomList.length > 0)
        );
      },
    );

    if (salesOrderItems && salesOrderItems.length > 0) {
      console.log('salesOrderItems', salesOrderItems);

      for (const soItem of salesOrderItems) {
        if (typeof soItem.SN !== 'number' || soItem.SN !== soItem.SN) {
          throw new BadRequestException('Some lines are not a number');
        }
      }
      salesOrderItems.sort((a, b) => a.SN - b.SN);

      // Check duplicate of Bom by matching BOM and description
      this.checkBomDuplicate(salesOrderItems);
      this.checkDuplicateProductInBOMItem(salesOrderItems);

      for (const soItemDTO of salesOrderItems) {
        // This happens when BOM converted from quotation without BomList skus
        if (soItemDTO.productId) {
          const product = await this.productsService.findOne(
            soItemDTO.productId,
          );
          if (product) {
            if (product.bom && !soItemDTO.BomList) {
              throw new BadRequestException(
                `Line ${soItemDTO.SN} is a BOM but has no list of SKUs, kindly re-select existing BOM`,
              );
            }
          }
        }

        if (
          !soItemDTO.bom &&
          soItemDTO.BomList &&
          soItemDTO.BomList.length > 0
        ) {
          console.log(`Line ${soItemDTO.SN} has no bomId`);
          console.log('User created new line to create BOM');
          const hasBomId = false;
          const createdBOM = await this.createBomAsProduct(soItemDTO, hasBomId);

          if (createdBOM) {
            soItemDTO.bom = createdBOM._id;
          }

          const product = await this.calUnitCostAndCreateProduct(soItemDTO);

          if (product) {
            soItemDTO.productId = product._id;
          }
        } else if (
          soItemDTO.bom &&
          soItemDTO.BomList &&
          soItemDTO.BomList.length > 0
        ) {
          console.log(`Line ${soItemDTO.SN} has bomId and bomlist`);
          // find bom and get product list to check if any changes
          const bomData = await this.bomsService.findOne(soItemDTO.bom);
          console.log(' bomData.productList', bomData.productList);
          if (bomData) {
            const hasDifferent = bomData.productList.filter(
              (itemDB: { qty: number; product: string; sku: string }) =>
                !soItemDTO.BomList.some(
                  (itemDTO) =>
                    itemDB.qty === itemDTO.qtyTwo &&
                    itemDB.product == itemDTO.product &&
                    itemDB.sku == itemDTO.sku,
                ),
            );

            if (
              bomData.description !== soItemDTO.description ||
              hasDifferent.length > 0 ||
              bomData.productList.length !== soItemDTO.BomList.length
            ) {
              console.log(
                `User selected line ${soItemDTO.SN} to modified BOM info, proceed to create new BOM`,
              );

              const hasBomId = false;
              const createdBOM = await this.createBomAsProduct(
                soItemDTO,
                hasBomId,
              );

              if (createdBOM) {
                soItemDTO.bom = createdBOM._id;
              }

              const product = await this.calUnitCostAndCreateProduct(soItemDTO);
              if (product) {
                soItemDTO.productId = product._id;
              }
            } else {
              console.log(
                `No changes has been made on this line ${soItemDTO.SN}`,
              );
            }
          }
        }

        delete soItemDTO._id;
      }
    }

    // Create Product and SKU
    // await this.createOrUpdateProductAndSku(createSalesOrderDto);

    if (createSalesOrderDto.currency) {
      //find purchase rate
      const currency = await this.currenciesService.findOne(
        createSalesOrderDto.currency,
      );
      for (let i = 0; i < currency.currencyRate.length; i++) {
        if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
          if (currency.currencyRate[i].rate > 0) {
            createSalesOrderDto.currencyRate = currency.latestRate;
            break;
          }
        }
      }
    }

    const { discount, total, gst, isPercentage } = createSalesOrderDto;
    // Calculation function
    const calculation = orderCalculation(discount, isPercentage, total, gst);

    const newSalesOrder = {
      createdDate: createSalesOrderDto.createdDate,
      salesPic: createSalesOrderDto.salesPic,
      custNo: createSalesOrderDto.custNo,
      custId: createSalesOrderDto.custId,
      custName: createSalesOrderDto.custName,
      address: createSalesOrderDto.address,
      telNo: createSalesOrderDto.telNo,
      faxNo: createSalesOrderDto.faxNo,
      buyerName: createSalesOrderDto.buyerName,
      buyerEmail: createSalesOrderDto.buyerEmail,
      delAddress: createSalesOrderDto.delAddress,
      remarks: createSalesOrderDto.remarks,
      paymentAddress: createSalesOrderDto.paymentAddress,
      incoterm: createSalesOrderDto.incoterm,
      paymentTerm: createSalesOrderDto.paymentTerm,
      currency: createSalesOrderDto.currency,
      discount: createSalesOrderDto.discount,
      total: createSalesOrderDto.total,
      gst: createSalesOrderDto.gst,
      downPayment: createSalesOrderDto.downPayment,
      exportLocal: createSalesOrderDto.exportLocal,
      salesOrderItems: salesOrderItems,
      quoRef: createSalesOrderDto.quoRef, // quotation Ref
      quotation: createSalesOrderDto.quotation, // quotation Id
      custPoNum: createSalesOrderDto.custPoNum,
      leadTime: createSalesOrderDto.leadTime,
      deliveryRemark: createSalesOrderDto.deliveryRemark,
      prices: createSalesOrderDto.prices,
      validity: createSalesOrderDto.validity,
      discountAmt: calculation.discountAmt,
      subTotalAmt: calculation.subTotalAmt,
      gstAmt: calculation.gstAmt,
      currencyRate: createSalesOrderDto.currencyRate,
      discountName: createSalesOrderDto.discountName,
      isPercentage: createSalesOrderDto.isPercentage,
    };

    const createdNewSalesOrder = new this.salesOrderModel(newSalesOrder);
    const createdSalesOrder = await createdNewSalesOrder.save();

    // if contains quotation Id
    // Update Quotatiion isConvert= true & salesOrder Id
    if (createSalesOrderDto.quotation) {
      const isMode = 'onCreate';
      await this.quotationsService.updateConvertStatus(
        createSalesOrderDto.quotation,
        createdSalesOrder._id,
        createdSalesOrder.status,
        isMode,
      );
    }

    return this.findOne(createdSalesOrder._id);
  }

  // Update single salesOrder by Id
  async update(
    id: string,
    updateSalesOrderDto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    const modelName = 'SalesOrder'; // hard-coded first
    const salesOrderFound = await this.salesOrderModel
      .findOne({ _id: id })
      .exec();

    console.log('updateSalesOrderDto', updateSalesOrderDto);

    if (!salesOrderFound) {
      throw new NotFoundException(`Sales order not found`);
    }
    const { status, soNumber, latestSalesOrder } = salesOrderFound;

    if (!latestSalesOrder) {
      throw new BadRequestException(`Old version, request denied`);
    }

    if (status === SalesStatusEnumDto.DELIVERED) {
      throw new BadRequestException(
        `SalesOrder in status - delivered, request denied`,
      );
    }

    if (status === SalesStatusEnumDto.INVOICED) {
      throw new BadRequestException(
        `SalesOrder has been invoiced, request denied`,
      );
    }

    if (status === SalesStatusEnumDto.CANCELLED) {
      throw new BadRequestException(
        `SalesOrder has been Cancelled, request denied`,
      );
    }

    // update workOrder status to cancelled
    if (
      updateSalesOrderDto.status === SalesStatusEnumDto.CANCELLED &&
      updateSalesOrderDto.status !== status
    ) {
      // await this.workOrdersService.updateWorkOrderStatus(
      //   _id,
      //   SalesStatusEnumDto.CANCELLED,
      // );

      // release all sku Reserved on workOrder
      const workOrder = await this.workOrdersService.findWorkOrderBySalesOrderId(
        salesOrderFound._id,
      );
      if (workOrder) {
        const triggerBy = 'onCancel';
        const woItemId = undefined;
        await this.workOrdersService.onCancelSkuReserve(
          woItemId,
          workOrder,
          triggerBy,
        );
      }
    }

    // Prevent SalesOrder to update when WO is in Progress

    if (
      updateSalesOrderDto.status === SalesStatusEnumDto.OPEN ||
      updateSalesOrderDto.status === status
    ) {
      const workOrder = await this.workOrdersService.findWorkOrderBySalesOrderId(
        salesOrderFound._id,
      );
      // Check WorkOrder woStatus
      if (workOrder && workOrder.woStatus !== WoStatusEnum.Processing) {
        // throw new BadRequestException(
        //   `WorkOrder has been in progress, request denied!!`,
        // );
      }
      if (workOrder && workOrder.woStatus === WoStatusEnum.Completed) {
        if (updateSalesOrderDto.freightAmount) {
          await this.salesOrderModel.findByIdAndUpdate(id, {
            freightAmount: updateSalesOrderDto.freightAmount,
          });
          return this.findOne(id);
        } else {
          throw new BadRequestException(
            `WorkOrder has been completed. Only Freight cost updated!`,
          );
        }
      }
    }

    // const salesOrderItems = updateSalesOrderDto.salesOrderItems;

    const salesOrderItems = updateSalesOrderDto.salesOrderItems.filter(
      (item) => {
        return (
          item.sku ||
          item.productId ||
          (item.BomList && item.BomList.length > 0)
        );
      },
    );

    if (salesOrderItems.length < 1) {
      throw new BadRequestException('OrderItem should not be empty');
    }

    console.log('Welcome to Sales Order update');

    if (salesOrderItems.length > 0) {
      for (const soItem of salesOrderItems) {
        if (typeof soItem.SN !== 'number' || soItem.SN !== soItem.SN) {
          throw new BadRequestException('Some lines are not a number');
        }
      }
      salesOrderItems.sort((a, b) => a.SN - b.SN);
      // Not allow duplicate of bom item in salesorder lines
      // Check duplicate of Bom by matching BOM and description

      this.checkBomDuplicate(salesOrderItems);
      this.checkDuplicateProductInBOMItem(salesOrderItems);

      // console.log('salesOrderItemsDto', salesOrderItems);

      // let incrementSN = 1;
      for (const soItemDTO of salesOrderItems) {
        // This happens when BOM converted from quotation without BomList skus
        if (soItemDTO.productId) {
          const product = await this.productsService.findOne(
            soItemDTO.productId,
          );
          if (product) {
            if (product.bom && !soItemDTO.BomList) {
              throw new BadRequestException(
                `Line ${soItemDTO.SN} is a BOM but has no list of SKUs, kindly re-select existing BOM`,
              );
            }
          }
        }

        // soItemDTO.SN = incrementSN++;

        if (
          !soItemDTO.bom &&
          soItemDTO.BomList &&
          soItemDTO.BomList.length > 0
        ) {
          console.log(`Line ${soItemDTO.SN} has no bomId, means BOM not exist`);
          console.log('User created new line to create BOM');
          const hasBomId = false;
          const createdBOM = await this.createBomAsProduct(soItemDTO, hasBomId);

          if (createdBOM) {
            console.log('insertBOM_id');
            soItemDTO.bom = createdBOM._id;
          }

          const product = await this.calUnitCostAndCreateProduct(soItemDTO);

          if (product) {
            soItemDTO.productId = product._id;
          }
        } else if (
          soItemDTO.bom &&
          soItemDTO.BomList &&
          soItemDTO.BomList.length > 0
        ) {
          console.log(`Line ${soItemDTO.SN} has bomId and bomlist`);
          // find bom and get product list to check if any changes
          const bomData = await this.bomsService.findOne(soItemDTO.bom);
          if (bomData) {
            const hasDifferent = bomData.productList.filter(
              (itemDB: { qty: number; product: string; sku: string }) =>
                !soItemDTO.BomList.some(
                  (itemDTO) =>
                    itemDB.qty === itemDTO.qtyTwo &&
                    itemDB.product == itemDTO.product &&
                    itemDB.sku == itemDTO.sku,
                ),
            );

            if (
              bomData.description !== soItemDTO.description ||
              hasDifferent.length > 0 ||
              bomData.productList.length !== soItemDTO.BomList.length
            ) {
              console.log(
                `User selected line ${soItemDTO.SN} to modify BOM info, proceed to create new BOM`,
              );

              const hasBomId = false;
              const createdBOM = await this.createBomAsProduct(
                soItemDTO,
                hasBomId,
              );

              if (createdBOM) {
                soItemDTO.bom = createdBOM._id;
              }

              const product = await this.calUnitCostAndCreateProduct(soItemDTO);
              if (product) {
                soItemDTO.productId = product._id;
              }
            } else {
              console.log(
                `No changes has been made inside the BOM itmes on this line ${soItemDTO.SN}`,
              );
            }
          }
        }
      }
    }

    updateSalesOrderDto.salesOrderItems = salesOrderItems;

    if (updateSalesOrderDto.currency) {
      //find purchase rate
      const currency = await this.currenciesService.findOne(
        updateSalesOrderDto.currency,
      );
      for (let i = 0; i < currency.currencyRate.length; i++) {
        if (currency.currencyRate[i].type == typeOfCurrency.Sale) {
          if (currency.currencyRate[i].rate > 0) {
            updateSalesOrderDto.currencyRate = currency.latestRate;
            break;
          }
        }
      }
    }

    const { discount, total, gst, isPercentage } = updateSalesOrderDto;

    // Calculation function
    const calculation = orderCalculation(discount, isPercentage, total, gst);

    updateSalesOrderDto.discountAmt = calculation.discountAmt;
    updateSalesOrderDto.gstAmt = calculation.gstAmt;
    updateSalesOrderDto.subTotalAmt = calculation.subTotalAmt;

    // Create SO Number
    if (
      updateSalesOrderDto.status === SalesStatusEnumDto.OPEN &&
      updateSalesOrderDto.status !== status
    ) {
      console.log('salesorder status = OPEN');

      if (soNumber) {
        // If has soNumber, proceed update but do not run sequence function
        console.log(
          `You have soNumber: ${soNumber}, No sequence settting is executed`,
        );
      } else {
        // No sequence number, proceed sequence function and save/update
        const settings = await this.sequenceSettingsService.FindSequenceByModelName(
          modelName,
        );

        // Generate SoNumber
        const newSoNumber = this.sequenceSettingsService.sequenceSettingEx(
          settings,
        );

        const replaceChar = settings.prefix;
        const toIncrement = false;
        const count = 0;
        const reformat = modifySequenceNumber(
          newSoNumber,
          count,
          replaceChar,
          toIncrement,
          settings.prefix,
        );

        updateSalesOrderDto.soNumber = newSoNumber;
        updateSalesOrderDto.ciplNum = reformat.ciplNum;

        // To update isWoConverted to true
        updateSalesOrderDto.toggleGenerateWO = true;

        // If nextNumber exist, update new Sequence number into dbase
        await this.sequenceSettingsService.updateSequenceByModelName(
          modelName,
          settings,
        );
      }
    }

    // Update SalesOrder

    const updatedSalesOrder = await this.salesOrderModel.findByIdAndUpdate(
      { _id: id },
      updateSalesOrderDto,
      { new: true },
    );

    // For Testing Only
    // await this.createPurchaseListTemp(updatedSalesOrder._id);

    console.log('SALES ORDER UPDATED');
    console.log('===== START HERE =====');

    if (!updatedSalesOrder) {
      throw new NotFoundException('Sales order not found!');
    }

    // Call Quotation service to update SO status and SoNumber in quotation if exist
    if (updatedSalesOrder && updatedSalesOrder.quotation) {
      await this.quotationsService.updateSoDetail(
        updatedSalesOrder.quotation,
        updatedSalesOrder.soNumber,
        updatedSalesOrder.status,
      );
    }

    // Ensure to generate one WorkOrder only
    if (
      updatedSalesOrder.status === SalesStatusEnumDto.OPEN &&
      updatedSalesOrder.toggleGenerateWO === true
    ) {
      console.log('Generate WorkOrder when SalesOrder opened');

      // One time create
      await this.createPurchaseListTemp(updatedSalesOrder._id);

      // Execute Create
      await this.workOrdersService.createWorkOrder(updatedSalesOrder);

      // switch of WO generator
      await this.salesOrderModel.findByIdAndUpdate(
        { _id: updatedSalesOrder.id },
        { toggleGenerateWO: false, woStatus: WoStatusEnum.Open },
        { new: true },
      );
    }
    //  ===================================================> WorkOrder Update Look Below
    if (
      updatedSalesOrder.toggleGenerateWO === false &&
      updatedSalesOrder.status === SalesStatusEnumDto.OPEN
    ) {
      console.log('To update WorkOrder from SalesOrder');
      await this.createPurchaseListTemp(updatedSalesOrder._id);
      await this.workOrdersService.updateWorkOrderFromSO(updatedSalesOrder);
    }

    const result = await this.findOne(id);

    return result;
  }

  // For create new salesorder situation
  async calUnitCostAndCreateProduct(
    soItemDTO: SaleOrderItemsDto,
  ): Promise<Product> {
    // Reminder, change of unitPrice on salesorder line will not recalculate or update product
    console.log('Calculate unitCost and Create Product');
    for (const bomItem of soItemDTO.BomList) {
      // find skus from bomlist to get unitcost

      const product = await this.skusService.findOneSkuByProductId(
        bomItem.product,
      );
      if (product) {
        bomItem.unitCost = product.unitCost;
      } else {
        bomItem.unitCost = 0;
      }
    }
    const initialValue = 0;
    const totalUnitCost = soItemDTO.BomList.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.unitCost * currentValue.qtyTwo,
      initialValue,
    );

    const product = await this.productsService.createOrUpdateProductAndSKU(
      soItemDTO,
      totalUnitCost,
    );

    return product;
  }

  // Make BOM Function
  async createBomAsProduct(soItemDTO: SaleOrderItemsDto, hasBomId: boolean) {
    if (soItemDTO.BomList && soItemDTO.BomList.length > 0) {
      let bomObject = {};
      let bomList = [];
      let bomPayload = {};

      for (const bom of soItemDTO.BomList) {
        bomObject = {
          product: bom.product,
          sku: bom.sku,
          qty: bom.qtyTwo,
        };

        bomList.push(bomObject);

        if (hasBomId) {
          bomPayload = {
            _id: soItemDTO.bom,
            description: soItemDTO.description,
            productList: bomList,
          };
        } else {
          bomPayload = {
            _id: undefined,
            description: soItemDTO.description,
            productList: bomList,
          };
        }
      }

      const createdBOM = await this.bomsService.create(bomPayload);

      bomList = [];

      return createdBOM;
    }
  }

  async updateOldVersion(id: string) {
    const response = await this.salesOrderModel.findByIdAndUpdate(
      id,
      { latestSalesOrder: false },
      { new: true },
    );
    return response;
  }

  // Do Not Use
  async createNewVersion(originalSalesOrder: SalesOrder) {
    if (originalSalesOrder.latestSalesOrder === false) {
      throw new BadRequestException(
        'New version has been created, request denied',
      );
    }

    if (!originalSalesOrder.soNumber) {
      throw new BadRequestException(`Sales order's confirmation required`);
    }

    if (originalSalesOrder.salesOrderItems.length) {
      for (let i = 0; i < originalSalesOrder.salesOrderItems.length; i++) {
        if (originalSalesOrder.salesOrderItems[i].bom) {
          let bomList = [];
          const bomObj = await this.bomsService.findOne(
            originalSalesOrder.salesOrderItems[i].bom,
          );
          for (let j = 0; j < bomObj.productList.length; j++) {
            bomList.push({
              sku: bomObj.productList[j].sku,
              qty: bomObj.productList[j].qty,
              product: bomObj.productList[j].product,
            });
          }

          const BomResult = { productList: bomList };

          const createdBom = await this.bomsService.create(BomResult);
          bomList = [];
          originalSalesOrder.salesOrderItems[i].bom = createdBom._id;
        }
      }
    }

    const newSalesOrder = {
      createdDate: originalSalesOrder.createdDate,
      salesPic: originalSalesOrder.salesPic,
      custNo: originalSalesOrder.custNo,
      custPoNum: originalSalesOrder.custPoNum,
      custId: originalSalesOrder.custId,
      custName: originalSalesOrder.custName,
      soNumber: originalSalesOrder.soNumber,
      status: originalSalesOrder.status,
      address: originalSalesOrder.address,
      telNo: originalSalesOrder.telNo,
      faxNo: originalSalesOrder.faxNo,
      buyerName: originalSalesOrder.buyerName,
      buyerEmail: originalSalesOrder.buyerEmail,
      poNumber: originalSalesOrder.poNumber,
      delAddress: originalSalesOrder.delAddress,
      paymentAddress: originalSalesOrder.paymentAddress,
      incoterm: originalSalesOrder.incoterm,
      paymentTerm: originalSalesOrder.paymentTerm,
      currency: originalSalesOrder.currency,
      discount: originalSalesOrder.discount,
      total: originalSalesOrder.total,
      gst: originalSalesOrder.gst,
      downPayment: originalSalesOrder.downPayment,
      versionNum: originalSalesOrder.versionNum + 1,
      quoRef: originalSalesOrder.quoRef, // quotation Ref
      quotation: originalSalesOrder.quotation, // quotation Id
      exportLocal: originalSalesOrder.exportLocal,
      remarks: originalSalesOrder.remarks,
      salesOrderItems: originalSalesOrder.salesOrderItems,
      initialVersion: originalSalesOrder.initialVersion
        ? originalSalesOrder.initialVersion
        : originalSalesOrder._id,
      leadTime: originalSalesOrder.leadTime,
      deliveryRemark: originalSalesOrder.deliveryRemark,
      prices: originalSalesOrder.prices,
      validity: originalSalesOrder.validity,
      discountAmt: originalSalesOrder.discountAmt,
      subTotalAmt: originalSalesOrder.subTotalAmt,
      gstAmt: originalSalesOrder.gstAmt,
      ciplNum: originalSalesOrder.ciplNum,
      discountName: originalSalesOrder.discountName,
      isPercentage: originalSalesOrder.isPercentage,
    };

    const createdNewversion = await this.salesOrderModel.create(newSalesOrder);

    return this.findOne(createdNewversion._id);
  }

  // Do not use
  async convertToSalesOrder(quotationConvert: QuotationConvert) {
    const newSalesOrder = new this.salesOrderModel(quotationConvert);
    return await newSalesOrder.save();
  }

  // Find All Sales Orders without Filter
  async findAll(): Promise<SalesOrder[]> {
    const response = await this.salesOrderModel.find().exec();
    return response;
  }

  async findWithDate(): Promise<SalesOrder[]> {
    const date1 = moment().startOf('year').format('YYYY-MM-DD');
    const date2 = moment().format('YYYY-MM-DD');
    return await this.salesOrderModel
      .find({ createdAt: { $gte: date1, $lte: date2 } })
      .exec();
  }

  async findWithDateForYTDSales(): Promise<SalesOrder[]> {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 4, 1);
    const endDate = new Date(currentYear + 1, 3, 31);
    // const date1 = `${moment().year()}-05-01`;
    // const date2 = `${moment().year() + 1}-04-30`;

    return await this.salesOrderModel
      .find({ createdDate: { $gte: startDate, $lte: endDate } })
      .exec();
  }

  //Find All + Filter
  async getfilters(query: FilterDto, user: User): Promise<any> {
    const limit = query.limit ? query.limit : 0;
    const skip = query.skip ? query.skip : 0;
    const filter = query.filter ? query.filter : [];
    const searchText = query.searchText ? query.searchText : '';
    const orderBy =
      query.orderBy && Object.keys(query.orderBy).length > 0
        ? query.orderBy
        : { soNumber: -1 };

    let where = {};
    const namedFilter = [];
    let grandTotatQueryInput = {};

    // use this when ready for it
    if (!user.isManager) {
      namedFilter.push({ salesPic: user.sub });
    }

    namedFilter.push({ latestSalesOrder: true });

    if (filter != null) {
      for (let i = 0; i < filter.length; i++) {
        const property = Object.keys(filter[i])[0];
        const propVal = Object.values(filter[i])[0];

        //console.log('PROPS', property, propVal);
        if (property === 'status') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              //if in array

              namedFilter.push({ status: { $in: propVal } });
            } else {
              // if not in Array
              namedFilter.push({ status: propVal });
            }
          }
        } else if (property === 'woStatus') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              //if in array

              namedFilter.push({ woStatus: { $in: propVal } });
            } else {
              // if not in Array
              namedFilter.push({ woStatus: propVal });
            }
          }
        } else if (property === 'doStatus') {
          if (propVal !== '') {
            if (Array.isArray(propVal)) {
              //if in array

              namedFilter.push({ doStatus: { $in: propVal } });
            } else {
              // if not in Array
              namedFilter.push({ doStatus: propVal });
            }
          }
        } else if (property === 'total' || property === 'grandTotalAmt') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === '') {
              // if min field is empty, filter (less than)
              grandTotatQueryInput = {
                grandTotalAmt: { $lte: parseInt(propVal[1]) },
              };
            } else if (propVal[1] === '') {
              // if max field is empty, filter (greater than)
              grandTotatQueryInput = {
                grandTotalAmt: { $gte: parseInt(propVal[0]) },
              };
            } else {
              // else filter (greater and lesser)
              grandTotatQueryInput = {
                grandTotalAmt: {
                  $gte: parseInt(propVal[0]),
                  $lte: parseInt(propVal[1]),
                },
              };
            }
          }
        } else if (property === 'updatedAt') {
          if (Array.isArray(propVal)) {
            if (propVal[0] === 0) {
              // if Min field is empty, filter lesser
              namedFilter.push({ updatedAt: { $lte: propVal[1] } });
            } else {
              // if Min field is not empty, filter greater and lesser
              // https://stackoverflow.com/questions/55108562/why-does-eq-comparison-is-not-working-on-mongodb-with-dates
              const upperBoundDate = new Date(propVal[1]);
              upperBoundDate.setDate(upperBoundDate.getDate() + 1);
              namedFilter.push({
                updatedAt: { $gte: propVal[0], $lte: upperBoundDate },
              });
            }
          } else {
            // if Max field is empty, it is not in Array
            namedFilter.push({ updatedAt: { $gte: propVal } });
          }
        }
      }
    }

    if (namedFilter.length === 1) {
      where = namedFilter[0];
    } else if (namedFilter.length > 1) {
      where['$and'] = namedFilter;
    }
    // console.log(namedFilter);

    //Search and matching
    if (searchText && searchText != '') {
      const searchPattern = new RegExp('.*' + searchText + '.*', 'i');
      const searchFilter = {
        $or: [
          { soNumber: searchPattern }, // SO Number
          { custName: searchPattern }, // Customer name
          { quoRef: searchPattern }, // QuoRef
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
    let salesOrders;
    if (limit === 0) {
      // For dashboard listing
      salesOrders = await this.salesOrderModel
        .find(
          where,
          'status internalRemarks custName custNo createdAt soNumber',
        )
        .sort(orderBy);
    } else {
      // For SalesOrder Listing
      salesOrders = await this.salesOrderModel.aggregate([
        { $match: where },
        { $sort: orderBy },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            soNumber: 1,
            status: 1,
            woStatus: 1,
            doStatus: 1,
            currency: 1,
            custName: 1,
            versionNum: 1,
            internalRemarks: 1,
            grandTotalAmt: { $sum: ['$subTotalAmt', '$gstAmt'] },
            createdDate: 1,
            createdAt: 1,
            updatedAt: 1,
            custNo: 1,
          },
        },
        { $match: grandTotatQueryInput },
        {
          $lookup: {
            from: 'currencies',
            localField: 'currency',
            foreignField: '_id',
            as: 'currency',
          },
        },
        {
          $unwind: '$currency',
        },
        {
          $set: {
            id: '$_id',
          },
        },
        // { $sort: orderBy },
        // { $skip: skip },
        // { $limit: limit },
      ]);
    }

    // Group all old versions into oldVersionList Array
    for (let i = 0; i < salesOrders.length; i++) {
      if (salesOrders[i].initialVersion) {
        const oldVersionFound = await this.findOldVersions(
          salesOrders[i].initialVersion,
        );
        salesOrders[i].set('oldVersionList', oldVersionFound, {
          strict: false,
        });
      }
      // const grandTotalAmt = salesOrders[i].subTotalAmt + salesOrders[i].gstAmt;
      // salesOrders[i].set('grandTotalAmt', grandTotalAmt, {
      //   strict: false,
      // });
    }

    where =
      JSON.stringify(grandTotatQueryInput) !== '{}'
        ? grandTotatQueryInput
        : where;

    const count = await this.salesOrderModel.countDocuments(where);

    return [salesOrders, count];
  }

  // Find old Versions by initialVersion Id
  async findOldVersions(initialVersionIdArg: string): Promise<SalesOrder[]> {
    const response = await this.salesOrderModel
      .find({
        $or: [
          {
            $and: [
              { initialVersion: initialVersionIdArg },
              { latestSalesOrder: false },
            ],
          },
          { _id: initialVersionIdArg },
        ],
      })
      .sort({ versionNum: -1 });
    return response;
  }

  // Simple Find SalesOrder by Id
  async findStatusById(id: string): Promise<SalesOrder> {
    return await this.salesOrderModel.findOne({ _id: id }).exec();
  }

  async findByName(name: string): Promise<SalesOrder> {
    return await this.salesOrderModel.findOne({ soNumber: name });
  }

  // Fetch All Quotations Group
  async findAllSalesOrderDropdownGroup() {
    const paymentTerm = await this.paymentTermsService.findAll();
    const incoterm = await this.incotermService.findAll();
    const currency = await this.currenciesService.findAll();
    const gst = await this.taxesService.findAll();
    const discount = await this.discountsService.findAll();
    const personIncharge = await this.usersService.findAllPic();
    const uom = await this.uomService.findAll();

    return {
      incoterm: incoterm ? incoterm : [],
      paymentTerm: paymentTerm ? paymentTerm : [],
      gst: gst ? gst : [],
      currency: currency ? currency : [],
      discount: discount ? discount : [],
      personIncharge: personIncharge ? personIncharge : [],
      uom: uom ? uom : [],
    };
  }

  // Find Single SalesOrder
  async findOne(id: string): Promise<SalesOrder> {
    const response = await this.salesOrderModel
      .findOne({ _id: id })
      .populate('paymentTerm')
      .populate('currency')
      .populate('incoterm')
      .populate('tax')
      .populate('user')
      .exec();

    if (!response) throw new NotFoundException(`Sales order not found`);

    for (let i = 0; i < response.salesOrderItems.length; i++) {
      if (response.salesOrderItems[i].bom) {
        const bomList = [];
        const bomObj = await this.bomsService.findOne(
          response.salesOrderItems[i].bom,
        );
        for (let j = 0; j < bomObj.productList.length; j++) {
          let productObj;
          let skuData;
          if (bomObj.productList[j].sku) {
            skuData = await this.skusService.findOneSku(
              bomObj.productList[j].sku,
            );
            if (!skuData) {
              throw new NotFoundException(
                'You are selecting parent sku without product ID, sku not found, request denied',
              );
            }
            productObj = await this.productsService.findOne(skuData.product);
          } else if (bomObj.productList[j].product) {
            productObj = await this.productsService.findOne(
              bomObj.productList[j].product,
            );
            if (!productObj) {
              throw new NotFoundException(
                'You have a product in your BOM that does not exist',
              );
            }
          }

          bomList.push({
            product: bomObj.productList[j].product,
            sku: bomObj.productList[j].sku,
            qty: bomObj.productList[j].qty,
            skuData: skuData,
            productData: productObj,
          });
        }
        response.salesOrderItems[i].set('BomList', bomList, {
          strict: false,
        });
      }
    }
    if (response.woStatus == 'completed') {
      const gp = await this.calculateProfit(response);
      response.set('profit', gp, { strict: false });
      if (!response.profitDetails || response.profitDetails.length == 0) {
        //get profit details
        console.log('get profit details');
        const s2 = await this.salesOrderModel.findById(id).exec();
        response.set('profitDetails', s2.profitDetails, { strict: false });
      }
    }

    const workOrder = await this.workOrdersService.findWorkOrderBySalesOrderId(
      response._id,
    );
    if (workOrder) {
      for (const soItem of response.salesOrderItems) {
        for (const woItem of workOrder.workOrderItems) {
          if (String(soItem._id) == String(woItem.woItemId)) {
            if (woItem.woItemStatus === WoStatusEnum.Open) {
              // console.log('allow edit');
              soItem.set('lineItemOnEdit', true, {
                strict: false,
              });
            } else {
              // console.log('not allow to edit');
              soItem.set('lineItemOnEdit', false, {
                strict: false,
              });
            }
          }
        }
      }
    }

    return response;
  }

  // Delete SalesOrder by Id
  async removeOne(id: string) {
    // find sales oder by ID
    const salesOrderFound = await this.salesOrderModel
      .findOne({ _id: id })
      .exec();

    if (!salesOrderFound) {
      throw new NotFoundException(`Sales order not found`);
    }

    const { latestSalesOrder, status } = salesOrderFound;

    if (status === SalesStatusEnumDto.CLOSED) {
      throw new BadRequestException(
        `SalesOrder has been closed, request denied`,
      );
    }

    if (status === SalesStatusEnumDto.INVOICED) {
      throw new BadRequestException(
        `SalesOrder has been invoiced, request denied`,
      );
    }

    if (status === SalesStatusEnumDto.DELIVERED) {
      throw new BadRequestException(
        `SalesOrder has been delivered, request denied`,
      );
    }

    if (status === SalesStatusEnumDto.CANCELLED) {
      throw new BadRequestException(
        `SalesOrder has been cancelled, request denied`,
      );
    }

    if (latestSalesOrder) {
      // if status is not confirmed, Proceed to Delete
      if (status !== SalesStatusEnumDto.OPEN) {
        console.log(
          'Let proceed to delete this sales order as sales order is not Open or Win',
        );

        // Update Quotation Convert Status to False & Remove SalesOrderID
        if (salesOrderFound.quotation) {
          const isMode = 'onDelete';
          await this.quotationsService.updateConvertStatus(
            salesOrderFound.quotation,
            salesOrderFound._id,
            salesOrderFound.status,
            isMode,
          );
        }

        // Disable BOM deletion
        // salesOrderFound.salesOrderItems.forEach(
        //   async (item: { bom: string }) => {
        //     if (item.bom) {
        //       await this.bomsService.remove(item.bom);
        //     }
        //   },
        // );

        // Remove SalesOrder Document
        const deletedSalesOrder = await this.salesOrderModel.findByIdAndRemove({
          _id: id,
        });
        return deletedSalesOrder;
      }
      throw new BadRequestException(
        `Sales Order has been Opened. request denied`,
      );
    }
    throw new BadRequestException(`Old Sales order, request denied`);
  }

  async getSalesOrder(id: string): Promise<SalesOrder> {
    const response = await this.salesOrderModel.findById(id);
    // if (!response) {
    //   throw new NotFoundException('Sales order not found!');
    // }
    return response;
  }

  async generatePdf(id: string, type: string): Promise<any> {
    const salesOrder = await this.salesOrderModel.findById(id);

    if (!salesOrder) {
      throw new NotFoundException('SalesOrder Not Found');
    }

    const modelName = 'SalesOrder';
    const settings = await this.sequenceSettingsService.FindSequenceByModelName(
      modelName,
    );

    const replaceChar = settings.prefix;
    const toIncrement = false;
    const count = 0;
    const reformat = modifySequenceNumber(
      salesOrder.soNumber,
      count,
      replaceChar,
      toIncrement,
      settings.prefix,
    );

    salesOrder.plNum = reformat.PlNum;

    for (const soItem of salesOrder.salesOrderItems) {
      const uom = await this.uomService.findOne(soItem.uom);
      if (uom) {
        soItem.uomName = uom.name;
      }
    }

    let paymentTerm: PaymentTerm,
      currency: Currency,
      salesPic: User,
      incoterm: Incoterm;

    if (salesOrder.paymentTerm) {
      paymentTerm = await this.paymentTermsService.findOne(
        salesOrder.paymentTerm,
      );
    }

    if (salesOrder.currency) {
      currency = await this.currenciesService.findOne(salesOrder.currency);
    }

    if (salesOrder.salesPic) {
      salesPic = await this.usersService.findOnePic(salesOrder.salesPic);
    }

    if (salesOrder.incoterm) {
      incoterm = await this.incotermService.findOne(salesOrder.incoterm);
    }

    const createdDate = moment(salesOrder.createdDate).format('Do MMMM YYYY');

    const grandTotalAmt = salesOrder.subTotalAmt + salesOrder.gstAmt;
    const hasDownPayment = salesOrder.downPayment || 0;
    const balanceAmount = grandTotalAmt - hasDownPayment;

    const salesOrderPayLoad = {
      createdDate: createdDate,
      salesPicLastname: salesPic ? salesPic.lastName : undefined, // pop
      salesPicFirstname: salesPic ? salesPic.firstName : undefined, // pop
      custNo: salesOrder.custNo,
      soNumber: salesOrder.soNumber,
      custName: salesOrder.custName,
      address: salesOrder.address,
      telNo: salesOrder.telNo,
      faxNo: salesOrder.faxNo,
      buyerName: salesOrder.buyerName,
      buyerEmail: salesOrder.buyerEmail,
      quoRef: salesOrder.quoRef,
      delAddress: salesOrder.delAddress ? salesOrder.delAddress : '',
      remarks: salesOrder.remarks,
      paymentAddress: salesOrder.paymentAddress
        ? salesOrder.paymentAddress
        : '',
      status: salesOrder.status,
      incoterm: incoterm ? incoterm.name : undefined, // pop
      paymentTermName: paymentTerm ? paymentTerm.name : undefined, // pop
      paymentTermDays: paymentTerm ? paymentTerm.days : undefined, // pop
      currency: currency ? currency.name : undefined, // pop
      currencyLatestRate: currency ? currency.latestRate : undefined, // pop
      currencySymbol: currency ? currency.symbol : undefined, // pop
      currencySymbol2: currency ? currency.currencySymbol : undefined, // pop
      discount: salesOrder.discount,
      total: salesOrder.total,
      gst: salesOrder.gst,
      downPayment: salesOrder.downPayment, // pop maybe
      balance: salesOrder.total - salesOrder.downPayment,
      exportLocal: salesOrder.exportLocal,
      salesOrderItems: salesOrder.salesOrderItems,
      custPoNum: salesOrder.custPoNum,
      leadTime: salesOrder.leadTime,
      deliveryRemark: salesOrder.deliveryRemark,
      prices: salesOrder.prices,
      validity: salesOrder.validity,
      discountAmt: salesOrder.discountAmt,
      subTotalAmt: salesOrder.subTotalAmt,
      gstAmt: salesOrder.gstAmt,
      grandTotalAmt: grandTotalAmt,
      balanceAmount: balanceAmount,
      ciplNum: salesOrder.ciplNum,
      discountName: salesOrder.discountName,
      plNum: salesOrder.plNum, // Added New
      type: type, // added new  type is either proforma or commercial
      isPercentage: salesOrder.isPercentage,
    };
    return salesOrderPayLoad;
  }

  // status update from delivered / invoiced to closed
  async updateStatus(
    id: string,
    statusDTO: SalesStatusEnumDto,
  ): Promise<SalesOrder> {
    const salesOrder = await this.getSalesOrder(id);
    if (salesOrder) {
      const { status } = salesOrder;

      let newStatus: string;

      if (
        (statusDTO === SalesStatusEnumDto.DELIVERED &&
          status !== SalesStatusEnumDto.INVOICED) ||
        (statusDTO === SalesStatusEnumDto.INVOICED &&
          status !== SalesStatusEnumDto.DELIVERED)
      ) {
        newStatus = statusDTO;
      } else {
        newStatus = SalesStatusEnumDto.CLOSED;
      }
      return await this.salesOrderModel.findByIdAndUpdate(
        id,
        { status: newStatus },
        { new: true },
      );
    }
  }

  async updateInvoiceStatus(
    id: string,
    statusDto: SalesStatusEnumDto,
  ): Promise<SalesOrder> {
    return await this.salesOrderModel.findByIdAndUpdate(
      id,
      { status: statusDto },
      { new: true },
    );
  }

  //file id store
  async updateFileId(id: string, file: string): Promise<SalesOrder> {
    //console.log('id',id)
    //console.log('file',file)
    return await this.salesOrderModel.findByIdAndUpdate(
      id,
      { file: file },
      { new: true },
    );
  }

  // status update from delivered / invoiced to closed
  async updateDoStatus(id: string, newStatus: string): Promise<SalesOrder> {
    const salesOrder = await this.getSalesOrder(id);
    if (salesOrder) {
      return await this.salesOrderModel.findByIdAndUpdate(
        id,
        { doStatus: newStatus },
        { new: true },
      );
    }
  }

  async updateNewRemark(
    id: string,
    updateSalesOrderDto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    return await this.salesOrderModel.findByIdAndUpdate(
      id,
      updateSalesOrderDto,
      { new: true },
    );
  }

  async updateWorkOrderStatus(id: string, newStatus: WoStatusEnum) {
    await this.salesOrderModel.findByIdAndUpdate(id, { woStatus: newStatus });
  }

  async updateSimpleByAdmin(
    id: string,
    updateSalesOrderDto: UpdateSalesOrderDto,
  ) {
    const response = await this.salesOrderModel.findByIdAndUpdate(
      id,
      updateSalesOrderDto,
      { new: true },
    );
    return response;
  }

  async findSoAndWORestriction(id: string) {
    const salesOrder = await this.salesOrderModel.findById(id);

    if (salesOrder && salesOrder.quoRef) {
      console.log('Not Allow to remove, SalesOrder linked with Quotation');
      throw new BadRequestException(
        'Not Allow to remove, SalesOrder linked with Quotation',
      );
    }

    if (salesOrder && salesOrder.woStatus !== WoStatusEnum.Open) {
      console.log('Not allow to remove, WorkOrder is no longer Opened');
      throw new BadRequestException(
        'Not allow to remove, WorkOrder is no longer Opened',
      );
    }

    return salesOrder;
  }

  async removeSOandWO(id: string): Promise<void> {
    const workOrder = await this.workOrdersService.findWorkOrderBySalesOrderId(
      id,
    );

    if (workOrder) {
      await this.workOrderPickingsService.deleteMany(workOrder._id);

      await this.workOrdersService.removeWorkOrder(workOrder._id);
    }
    await this.salesOrderModel.deleteOne({ _id: id });
  }

  async calculateProfit(saleObject: SalesOrder): Promise<number> {
    //const order=await this.findOne(id);

    let discountAmt = 0;
    let gstAmt = 0;
    let currencyRate = 1;
    if (saleObject.currencyRate) {
      currencyRate = saleObject.currencyRate;
    }
    let subtotal = saleObject.total / currencyRate;
    if (saleObject.discount > 0) {
      discountAmt = saleObject.isPercentage
        ? (saleObject.discount / 100) * saleObject.total
        : saleObject.discount;
      //discountAmt = (saleObject.discount / 100) * saleObject.total;
    }
    subtotal -= discountAmt;
    if (saleObject.gst > 0) {
      gstAmt = subtotal * (saleObject.gst / 100);
    }

    const TotalAmount = subtotal + gstAmt;
    /*
    if (saleObject.profitDetails.length > 0) {
      var TotalCost = 0;
      for (let i = 0; i < saleObject.profitDetails.length; i++) {
        TotalCost += saleObject.profitDetails[i].totalCost;
      }
      if (saleObject.freightAmount) {
        TotalCost += saleObject.freightAmount;
      }
    } else {
      */
      const workOrder = await this.workOrdersService.getWorkOrderByOrderId(
        saleObject.id,
      );
      if (!workOrder) {
        return 0;
      }
      const workOrderPick = await this.workOrderPickingsService.findAllWorkOrderPickingByWoId(
        workOrder._id,
      );
      const profitDetails = [];
      let TotalSKUCost = 0;
      for (const picking of workOrderPick) {
        const sku = await this.skusService.findOneSku(picking.pickedSkuId);
        if (sku) {
          profitDetails.push({
            sku: picking.pickedSkuId,
            skuInfo: sku.product.partNumber,
            qty: picking.workQty,
            totalCost: sku.unitCost ? picking.workQty * sku.unitCost : 0,
          });
          if (sku.unitCost) {
            TotalSKUCost += picking.workQty * sku.unitCost;
          }
        }
      }
      /*
      if (profitDetails.length > 0) {
        await this.salesOrderModel.findByIdAndUpdate(saleObject._id, {
          profitDetails: profitDetails,
        });
      }
      */
      var TotalCost = TotalSKUCost;
      if (saleObject.freightAmount) {
        TotalCost += saleObject.freightAmount;
      }
    //}

    const Profit = TotalAmount - TotalCost;

    const GrossProfit = Math.round((Profit / TotalAmount) * 10000) / 100;
    return GrossProfit;
  }

  async findAllSaleOrderExportCSV() {
    const saleOrders = await this.salesOrderModel
      .find()
      .lean()
      .populate(['currency', 'salesPic']);
    const arr = [];
    await Promise.all(
      saleOrders.map(async (type) => {
        const data = {
          ...type,
          date: moment(type.updatedAt).format('DD/MM/YYYY'),
        };
        return arr.push(data);
      }),
    );
    return arr;
  }

  async findAllSaleOrderExportCSVWithDate(query: any): Promise<any> {
    const startDate = query.startDate ? query.startDate : '';
    const endDate = query.endDate ? query.endDate : '';
    if (startDate && endDate) {
      var saleOrders = await this.salesOrderModel
        .find({
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        })
        .lean()
        .populate(['currency', 'salesPic']);
    } else if (startDate && !endDate) {
      var saleOrders = await this.salesOrderModel
        .find({ createdDate: { $gte: new Date(startDate) } })
        .lean()
        .populate(['currency', 'salesPic']);
    } else if (!startDate && endDate) {
      var saleOrders = await this.salesOrderModel
        .find({ createdDate: { $lte: new Date(endDate) } })
        .lean()
        .populate(['currency', 'salesPic']);
    } else {
      var saleOrders = await this.salesOrderModel
        .find()
        .lean()
        .populate(['currency', 'salesPic']);
    }
    const arr = [];
    await Promise.all(
      saleOrders.map(async (type) => {
        const data = {
          ...type,
          date: moment(type.updatedAt).format('DD/MM/YYYY'),
        };
        return arr.push(data);
      }),
    );
    return arr;
  }

  async findAllBackOrderExportCSV(): Promise<any> {
    const backOrder = await this.salesOrderModel
      .find({ status: 'open' })
      .lean()
      .populate(['currency', 'salesPic']);
    //console.log('ba', backOrder)
    const arr = [];
    await Promise.all(
      backOrder.map(async (type) => {
        const data = {
          ...type,
          date: moment(type.updatedAt).format('DD/MM/YYYY'),
        };
        return arr.push(data);
      }),
    );
    return arr;
  }

  async generateAllSaleOrderPdf(): Promise<any> {
    const saleOrders = await this.salesOrderModel
      .find()
      .lean()
      .populate(['currency', 'salesPic']);

    return saleOrders;
  }

  async generateAllSaleOrderPdfWithDate(query: any): Promise<any> {
    const startDate = query.startDate ? query.startDate : '';
    const endDate = query.endDate ? query.endDate : '';
    if (startDate && endDate) {
      var saleOrders = await this.salesOrderModel
        .find({
          createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        })
        .lean()
        .populate(['currency', 'salesPic']);
    } else if (startDate && !endDate) {
      var saleOrders = await this.salesOrderModel
        .find({ createdDate: { $gte: new Date(startDate) } })
        .lean()
        .populate(['currency', 'salesPic']);
    } else if (!startDate && endDate) {
      var saleOrders = await this.salesOrderModel
        .find({ createdDate: { $lte: new Date(endDate) } })
        .lean()
        .populate(['currency', 'salesPic']);
    } else {
      var saleOrders = await this.salesOrderModel
        .find()
        .lean()
        .populate(['currency', 'salesPic']);
    }
    return saleOrders;
  }

  async generateAllBackOrderPdf(): Promise<any> {
    const saleOrders = await this.salesOrderModel
      .find()
      .lean()
      .populate(['currency', 'salesPic']);

    return saleOrders;
  }

  async createPurchaseListTemp(salesOrderId: string): Promise<any> {
    const catchSalesOrderItems = [];
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (salesOrder) {
      const purchaseListTempDB = await this.purchaseListTempService.findAllPOListTempBySalesOrderId(
        salesOrder._id,
      );

      for (const soItem of salesOrder.salesOrderItems) {
        const productExist = await this.productsService.findOneProductForWO(
          soItem.productId,
        );

        if (productExist) {
          if (soItem.bom) {
            // console.log('has bom');
            const bom = await this.bomsService.findOne(soItem.bom);
            if (bom) {
              for (const bomItem of bom.productList) {
                if (bomItem.product) {
                  const product = await this.productsService.findOneProductForWO(
                    bomItem.product,
                  );

                  const totalWorkQty = bomItem.qty * soItem.qty;
                  const createPurchaseListTempDto: CreatePurchaseListTempDto = {
                    salesOrderId: salesOrder._id,
                    description: product.description,
                    productId: bomItem.product,
                    sku: bomItem.sku,
                    qty: totalWorkQty,
                    isChecked: false,
                    isLatest: false,
                    isPoSubmitted: false,
                  };
                  catchSalesOrderItems.push(createPurchaseListTempDto);
                } else {
                  throw new NotFoundException(
                    'product not found inside BOM item',
                  );
                }
              }
            }
          } else {
            const createPurchaseListTempDto: CreatePurchaseListTempDto = {
              salesOrderId: salesOrder._id,
              description: soItem.description,
              productId: soItem.productId,
              sku: soItem.sku,
              qty: soItem.qty,
              isChecked: false,
              isLatest: false,
              isPoSubmitted: false,
            };

            catchSalesOrderItems.push(createPurchaseListTempDto);
          }
        } else {
          // Rare case
          throw new NotFoundException('Product not found in salesorder item');
        }
      }

      //console.log('catchSalesOrderItems', catchSalesOrderItems);
      // const isTriggered = true;
      const calPurchaseListTempDto = await this.calculateTotalQtyByProduct(
        catchSalesOrderItems,
        // isTriggered,
      );

      console.log('==== START PO TEMP LIST ====');

      if (purchaseListTempDB && purchaseListTempDB.length < 1) {
        console.log('The Orginal Of Create Temp List');

        for (const purchaseItemTemp of calPurchaseListTempDto) {
          await this.purchaseListTempService.create(purchaseItemTemp);
        }

        return await this.purchaseListTempService.findAllPOListTempBySalesOrderId(
          salesOrderId,
        );
      }

      const catchFalsePoSubmit = [];

      if (purchaseListTempDB && purchaseListTempDB.length > 0) {
        for (const purchaseListTempItemDB of purchaseListTempDB) {
          const foundCalPurchaseListDto = calPurchaseListTempDto.find(
            (item) =>
              String(item.productId) ===
              String(purchaseListTempItemDB.productId),
          );

          if (foundCalPurchaseListDto) {
            // Level 1
            if (purchaseListTempItemDB.isChecked) {
              // if checked split new
              // const isTriggered = false;
              const calPurchaseListDB = await this.calculateTotalQtyByProduct(
                purchaseListTempDB,
                // isTriggered,
              );

              // Find if got 2 level
              const findDuplicateProduct = purchaseListTempDB.find(
                (item) =>
                  String(item.productId) ===
                    String(purchaseListTempItemDB.productId) &&
                  item.isChecked == false,
              );

              const foundCalPurchaseListDB = calPurchaseListDB.find(
                (item) =>
                  String(item.productId) ===
                  String(purchaseListTempItemDB.productId),
              );

              if (findDuplicateProduct) {
                if (foundCalPurchaseListDto.qty > foundCalPurchaseListDB.qty) {
                  findDuplicateProduct.qty +=
                    foundCalPurchaseListDto.qty - foundCalPurchaseListDB.qty;

                  console.log(
                    `User is increasing qty to ${findDuplicateProduct.qty} - On Update`,
                  );

                  await this.purchaseListTempService.update(
                    findDuplicateProduct._id,
                    findDuplicateProduct,
                  );
                } else {
                  findDuplicateProduct.qty -=
                    foundCalPurchaseListDB.qty - foundCalPurchaseListDto.qty;

                  if (findDuplicateProduct.qty >= 0) {
                    // may have problem

                    findDuplicateProduct.qty -=
                      foundCalPurchaseListDB.qty - foundCalPurchaseListDto.qty;

                    console.log(
                      `User is updating qty to ${findDuplicateProduct.qty} - On Update`,
                    );

                    await this.purchaseListTempService.update(
                      findDuplicateProduct._id,
                      findDuplicateProduct,
                    );
                  } else {
                    console.log(
                      `User is deducting qty to ${findDuplicateProduct.qty} - On Remove`,
                    );
                    await this.purchaseListTempService.remove(
                      findDuplicateProduct._id,
                    );
                  }
                }
              } else {
                if (foundCalPurchaseListDto.qty > foundCalPurchaseListDB.qty) {
                  console.log('PO Exist- OnCreate New Level 2');
                  foundCalPurchaseListDto.isLatest = true;

                  foundCalPurchaseListDto.qty =
                    foundCalPurchaseListDto.qty - foundCalPurchaseListDB.qty;
                  await this.purchaseListTempService.create(
                    foundCalPurchaseListDto,
                  );
                }
              }
            }

            if (
              !purchaseListTempItemDB.isChecked &&
              !purchaseListTempItemDB.isLatest
            ) {
              purchaseListTempItemDB.qty = foundCalPurchaseListDto.qty;
              console.log('PO Not Exist - On Update Level 1');
              await this.purchaseListTempService.update(
                purchaseListTempItemDB._id,
                purchaseListTempItemDB,
              );
            }
          } else {
            if (!purchaseListTempItemDB.isPoSubmitted) {
              catchFalsePoSubmit.push(purchaseListTempItemDB);
            }
          }
        }

        for (const calPurchaseItemDto of calPurchaseListTempDto) {
          const match = purchaseListTempDB.find(
            (item) =>
              String(item.productId) === String(calPurchaseItemDto.productId),
          );

          if (!match) {
            await this.purchaseListTempService.create(calPurchaseItemDto);
          }
        }

        // Remove TemList of isSubmittedPoFalse if user removed salesItems
        await this.removePurchaseTempList(catchFalsePoSubmit);
      }

      return await this.purchaseListTempService.findAllPOListTempBySalesOrderId(
        salesOrderId,
      );
    } else {
      // very rare
      throw new NotFoundException('Sales Order Not Found');
    }
  }

  async calculateTotalQtyByProduct(
    catchSalesOrderItems: CreatePurchaseListTempDto[],
    // isTriggered: boolean,
  ) {
    // 1st layer of grouping Product
    const uniqueSalesOrderItemsByProduct = catchSalesOrderItems.reduce(
      (accumulator, current) => {
        if (
          !accumulator.some(
            (item) => String(item.productId) === String(current.productId),
          )
        ) {
          accumulator.push(current);
        }
        return accumulator;
      },
      [],
    );

    const outputArr = [];

    for (const uniqueSalesOrderItem of uniqueSalesOrderItemsByProduct) {
      const salesOrderItemsGrouped = catchSalesOrderItems.filter((item) => {
        if (String(item.productId) === String(uniqueSalesOrderItem.productId)) {
          return uniqueSalesOrderItem;
        }
      });

      let sumUpQtyOfSoItemDto = 0;
      // Sum up SoItem Qty
      for (const salesOrderItem of salesOrderItemsGrouped) {
        sumUpQtyOfSoItemDto += salesOrderItem.qty;
      }

      const purchaseItemPayload = {
        qty: sumUpQtyOfSoItemDto, // - sumUpQtyOfSkusByProduct,
        salesOrderId: uniqueSalesOrderItem.salesOrderId,
        description: uniqueSalesOrderItem.description,
        productId: uniqueSalesOrderItem.productId,
        sku: uniqueSalesOrderItem.sku,
        isChecked: false,
        isLatest: false,
        isPoSubmitted: false,
      };

      outputArr.push(purchaseItemPayload);
      // console.log('outputArr', outputArr);
    }

    return outputArr;
  }

  async removePurchaseTempList(catchFalsePoSubmit: PurchaseListTemp[]) {
    if (catchFalsePoSubmit && catchFalsePoSubmit.length > 0) {
      const uniqueTempListByProduct = catchFalsePoSubmit.reduce(
        (accumulator, current) => {
          if (
            !accumulator.some(
              (item) => String(item.productId) === String(current.productId),
            )
          ) {
            accumulator.push(current);
          }
          return accumulator;
        },
        [],
      );

      return await Promise.all(
        uniqueTempListByProduct.map(async (item: PurchaseListTemp) => {
          await this.purchaseListTempService.removeProductAndIsPoSubmittedFalse(
            item.productId,
            item.salesOrderId,
          );
        }),
      );
    }
  }

  /**
   * Below function will Reset entire WorkOrder till
   * jounalEntries documents.
   */

  async findOneHardReset(id: string): Promise<SalesOrder> {
    const salesOrder = await this.salesOrderModel.findById(id);
    console.log('Trigger Reset');
    if (salesOrder) {
      await this.workOrdersService.hardResetWorkOrder(salesOrder);
      salesOrder.woStatus = SalesStatusEnumDto.OPEN;
      salesOrder.status = SalesStatusEnumDto.OPEN;
      salesOrder.doCount = 0;
      salesOrder.doStatus = undefined;
      await salesOrder.save();

      return await this.findOne(salesOrder._id);
    } else {
      throw new NotFoundException('Sales order not found');
    }
  }

  async resetWorkOrderOnly(id: string): Promise<SalesOrder> {
    const salesOrder = await this.salesOrderModel.findById(id);
    console.log('Trigger Reset WorkOrderOnly');
    if (salesOrder) {
      await this.workOrdersService.resetWorkOrderOnly(salesOrder);

      salesOrder.woStatus = SalesStatusEnumDto.OPEN;
      salesOrder.status = SalesStatusEnumDto.OPEN;
      salesOrder.doCount = 0;
      salesOrder.doStatus = undefined;
      await salesOrder.save();

      return await this.findOne(salesOrder._id);
    } else {
      throw new NotFoundException('Sales order not found');
    }
  }
  //findOneWithSoNumber
  async findSaleOrderWithSoNumber(soNumber: string): Promise<SalesOrder> {
    const saleOne = await this.salesOrderModel.findOne({ soNumber: soNumber });
    if (!saleOne) {
      console.log('soNumber not found');
    }
    return saleOne;
  }

  checkDuplicateProductInBOMItem(salesOrderItems: SaleOrderItemsDto[]) {
    for (const soItemDTO of salesOrderItems) {
      console.log('soItemDto', soItemDTO);

      if (soItemDTO.BomList && soItemDTO.BomList.length > 0) {
        const BomProductList = soItemDTO.BomList.map((item) => item.product);
        const hasDuplicateProduct = BomProductList.some(
          (item, product) => BomProductList.indexOf(item, product + 1) !== -1,
        );

        if (hasDuplicateProduct) {
          throw new BadRequestException(
            'BOM Items contain duplicate of Sku/Product',
          );
        }
      }
    }
    console.log('Passby checkDuplicateProductInBOMItem');
    return true;
  }

  // Check to see if salesorder contain product in salesOrderItems that allow to be removed
  async onCheckingSalesOrderItemProduct(productId: string): Promise<boolean> {
    const salesOrders = await this.salesOrderModel.find().exec();

    if (salesOrders && salesOrders.length > 0) {
      for (const salesOrder of salesOrders) {
        const productFound = salesOrder.salesOrderItems.some(
          (item) => String(item.productId) === String(productId),
        );
        if (productFound) {
          throw new BadRequestException(
            'Product existed in salesOrder, deletion aborted',
          );
        }
      }
    }
    await this.purchasesService.onCheckingPurchaseOrderItemProduct(productId);
    await this.quotationsService.onCheckingSalesOrderItemProduct(productId);
    await this.invoicesService.onCheckingSalesOrderItemProduct(productId);

    return true;
  }
}
