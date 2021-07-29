// import * as mongoose from 'mongoose';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const castObjectId = mongoose.ObjectId.cast();
mongoose.ObjectId.cast((v: string) => (v === '' ? undefined : castObjectId(v)));

export const QuotationSchema = new Schema(
  {
    exportLocal: {
      type: String,
      enum: ['local', 'export'],
      default: 'local',
    },

    createdDate: { type: Date },

    // SO number
    soNumber: { type: String },

    // SO Status
    soStatus: { type: String },

    // sales pic - Ref BaseUser
    salesPic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    // customer number - Ref Customer
    custNo: { type: String },

    // customer number - Ref Customer
    custId: { type: mongoose.Schema.Types.ObjectId },

    // customer name
    custName: { type: String },

    // address
    address: { type: String },

    // tel Number
    telNo: { type: String },

    // fax Number
    faxNo: { type: String },

    // buyer name
    buyerName: { type: String },

    // buyer email
    buyerEmail: { type: String },

    // Quotation Ref
    quoRef: { type: String },

    // Sales Order Id
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: false,
    },

    // delivery address
    delAddress: { type: String },

    // remarks address
    remarks: { type: String },

    // payment address - Dropdown
    paymentAddress: { type: String },

    // isDraft/isConfirm - Dropdown
    status: { type: String, default: 'draft' },

    isConverted: { type: Boolean, default: false },

    latestQuotation: { type: Boolean, default: true },

    versionNum: { type: Number, default: 1 },

    initialVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: false,
    },
    // incoterm - Dropdown
    incoterm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incoterm',
      required: false,
    },

    // paymentTerm - Dropdown
    paymentTerm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentTerm',
      required: false,
    },

    // currency - Dropdown
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Currency',
      required: false,
    },

    currencyRate: { type: Number },

    // 4 fields - for REPORTING
    discount: { type: Number, default: 0 },

    total: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    downPayment: { type: Number, default: 0 },

    leadTime: { type: String },
    deliveryRemark: { type: String },
    custPoNum: { type: String },
    prices: { type: String },
    validity: { type: String },
    discountAmt: { type: Number },
    subTotalAmt: { type: Number },
    gstAmt: { type: Number },

    header: { type: String },
    box: { type: String },
    discountName: { type: String },
    isPercentage: { type: Boolean },
    workScope: { type: String },

    // Salesline  -  SKU ID Information Pending
    salesOrderItems: [
      {
        SN: { type: Number },
        sku: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku' },
        productId: { type: mongoose.Schema.Types.ObjectId },
        bom: { type: mongoose.Schema.Types.ObjectId, ref: 'Bom' },
        custRef: { type: String },
        uom: { type: mongoose.Schema.Types.ObjectId, ref: 'Uom' },
        description: { type: String },
        qty: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        extPrice: { type: Number, default: 0 },
      },
    ],
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
  },
  {
    timestamps: { createdAt: 'createdAt' },
  },
);

QuotationSchema.set('toJSON', { virtuals: true });
