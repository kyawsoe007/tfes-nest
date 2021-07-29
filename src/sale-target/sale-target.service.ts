import { Injectable } from '@nestjs/common';
import { CreateSaleTargetDto } from './dto/create-sale-target.dto';
import { UpdateSaleTargetDto } from './dto/update-sale-target.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SaleTarget } from './sale-target.interface';
import { SalesOrdersService } from 'src/sales-orders/sales-orders.service';
import { QuotationsService } from 'src/quotations/quotations.service';
import moment = require('moment');
import { SalesStatusEnumDto } from '../sales-orders/dto/create-sales-order.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { QuotationStatusEnumDto } from '../quotations/dto/create-quotation.dto';
import { InvoiceStatusEnum } from '../invoices/dto/create-invoice.dto';
import currencyFormat from '../shared/amountFormat';

@Injectable()
export class SaleTargetService {
  constructor(
    @InjectModel('SaleTarget')
    private readonly saleTargetModel: Model<SaleTarget>,
    private readonly salesOrderService: SalesOrdersService,
    private readonly quotationsService: QuotationsService,
    private readonly invoicesService: InvoicesService,
  ) {}
  async create(createSaleTargetDto: CreateSaleTargetDto): Promise<SaleTarget> {
    const newSaleTarget = new this.saleTargetModel(createSaleTargetDto);
    const createSaleTarget = await newSaleTarget.save();
    return createSaleTarget;
  }

  //perform with date
  async getDashBoardPerform() {
    const quotations = await this.quotationsService.findAll();
    const invoices = await this.invoicesService.findAll();
    const saleTarget = await this.findAll();
    const salesOrders = await this.salesOrderService.findAll(); // BackDoor has not date
    // const res = await this.salesOrderService.findWithDate();
    const salesOrdersYTD = await this.salesOrderService.findWithDateForYTDSales();
    const quotationsYTD = await this.quotationsService.findWithDateForYTDQuotations();
    const invoicesYTD = await this.invoicesService.findWithDateForYTDInvoices();

    //fy_target== IGNORED
    const fy_target_arr = saleTarget.map((item) => {
      if (item.name == 'FY Target') return item.target;
    });

    const filtered_fy_target = fy_target_arr.filter(function (el) {
      return el != null;
    });

    const fy_target = filtered_fy_target.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    // BACK ORDER DATE NOT REQUIRED =============================>

    const ytdbackOrdersOpen = salesOrders.filter(
      (item) => item.status === SalesStatusEnumDto.OPEN,
    );

    const ytdBackOrdersCalculated = ytdbackOrdersOpen.map((item) => {
      let totalWithCurrency: number;
      const currencyRate = item.currencyRate || 1;

      if (item.subTotalAmt === 0) {
        totalWithCurrency = 0;
      } else {
        totalWithCurrency = (item.subTotalAmt + item.gstAmt) / currencyRate;
      }

      return totalWithCurrency;
    });

    const ytdBackOrders = ytdBackOrdersCalculated.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    // YEARLY ORDERS ============================>
    const ytdOrdersNonDraft = salesOrdersYTD.filter(
      (item) => item.status !== SalesStatusEnumDto.DRAFT,
    );

    const ytdOrdersCalculated = ytdOrdersNonDraft.map((item) => {
      let totalWithCurrency: number;
      const currencyRate = item.currencyRate || 1;

      if (item.subTotalAmt === 0) {
        totalWithCurrency = 0;
      } else {
        totalWithCurrency = (item.subTotalAmt + item.gstAmt) / currencyRate;
      }
      return totalWithCurrency;
    });

    const ytdOrders = ytdOrdersCalculated.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    //YEARLY INVOICE ============================>
    const ytdSalesNonDraft = invoicesYTD.filter(
      (item) => item.status !== InvoiceStatusEnum.DRAFT,
    );

    const ytdSalesCalculated = ytdSalesNonDraft.map((item) => {
      let totalWithCurrency: number;
      const currencyRate = item.currencyRate || 1;

      if (item.grandTotal === 0) {
        totalWithCurrency = 0;
      } else {
        totalWithCurrency = item.grandTotal / currencyRate;
      }

      return totalWithCurrency;
    });

    const ytdSales = ytdSalesCalculated.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    // YEARLY QUOTATION =================================>

    const quotationsNonDraft = quotationsYTD.filter(
      (item) => item.status !== QuotationStatusEnumDto.DRAFT,
    );

    const ytdQuotationsCalculated = quotationsNonDraft.map((item) => {
      let totalWithCurrency: number;
      const currencyRate = item.currencyRate || 1;

      if (item.subTotalAmt === 0) {
        totalWithCurrency = 0;
      } else {
        totalWithCurrency = (item.subTotalAmt + item.gstAmt) / currencyRate;
      }
      return totalWithCurrency;
    });

    const ytdQuotations = ytdQuotationsCalculated.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    // MONTHLY SALES - INVOICE ==========================
    const mtd_sale_arr = invoices.filter(
      (item) =>
        item.status !== InvoiceStatusEnum.DRAFT &&
        moment(item.invoiceDate).isSame(moment.now(), 'month'),
    );

    const filtered_mtd_sale = mtd_sale_arr.map((item) => {
      let totalWithCurrency: number;
      const currencyRate = item.currencyRate || 1;

      if (item.grandTotal === 0) {
        totalWithCurrency = 0;
      } else {
        totalWithCurrency = item.grandTotal / currencyRate;
      }

      return totalWithCurrency;
    });

    const mtd_sale = filtered_mtd_sale.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    // MONTHILY QUOTATIONS =========================>
    const mtd_quote_arr = quotations.filter(
      (item) =>
        item.status !== QuotationStatusEnumDto.DRAFT &&
        moment(item.createdDate).isSame(moment.now(), 'month'),
    );

    const filtered_mtd_quote = mtd_quote_arr.map((item) => {
      let totalWithCurrency: number;
      const currencyRate = item.currencyRate || 1;

      if (item.subTotalAmt === 0) {
        totalWithCurrency = 0;
      } else {
        totalWithCurrency = (item.subTotalAmt + item.gstAmt) / currencyRate;
      }
      return totalWithCurrency;
    });

    const mtd_quote = filtered_mtd_quote.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    // MONTHYLY ORDERS =============================>
    const mtd_order_arr = salesOrders.filter(
      (item) =>
        item.status !== SalesStatusEnumDto.DRAFT &&
        moment(item.createdDate).isSame(moment.now(), 'month'),
    );

    const filtered_mtd_order = mtd_order_arr.map((item) => {
      let totalWithCurrency: number;
      const currencyRate = item.currencyRate || 1;

      if (item.subTotalAmt === 0) {
        totalWithCurrency = 0;
      } else {
        totalWithCurrency = (item.subTotalAmt + item.gstAmt) / currencyRate;
      }
      return totalWithCurrency;
    });

    const mtd_order = filtered_mtd_order.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    //mtd order tg ====> IGNORED
    const mtd_target_arr = saleTarget.map((item) => {
      if (item.name == 'MTD Order Tgt') return item.target;
    });
    const filtered_mtd_target = mtd_target_arr.filter(function (el) {
      return el != null;
    });
    const mtd_target = filtered_mtd_target.reduce(function (acc, val) {
      return acc + val;
    }, 0);

    const data = {
      fy_target: currencyFormat(Number(fy_target)), // ignored
      back_order: currencyFormat(Number(ytdBackOrders)),
      ytd_sale: currencyFormat(Number(ytdSales)),
      ytd_quote: currencyFormat(Number(ytdQuotations)),
      ytd_order: currencyFormat(Number(ytdOrders)),
      mtd_sale: currencyFormat(Number(mtd_sale)),
      mtd_quote: currencyFormat(Number(mtd_quote)),
      mtd_order: currencyFormat(Number(mtd_order)),
      mtd_target: currencyFormat(Number(mtd_target)), // ignored
    };

    return data;
  }

  async findAll(): Promise<SaleTarget[]> {
    const response = await this.saleTargetModel.find();
    return response;
  }
  async findOne(id: string): Promise<SaleTarget> {
    const response = await this.saleTargetModel.findOne({ _id: id });
    return response;
  }

  async update(
    id: string,
    updateSaleTargetDto: UpdateSaleTargetDto,
  ): Promise<SaleTarget> {
    await this.saleTargetModel.findByIdAndUpdate(
      { _id: id },
      updateSaleTargetDto,
    );

    return this.findOne(id);
  }
  async remove(id: string): Promise<any> {
    const response = await this.saleTargetModel.findByIdAndRemove({ _id: id });
    return response;
  }
}
