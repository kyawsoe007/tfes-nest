import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

// const ExpLocOptions = Object.freeze({
//   LOCAL: 'local',
//   EXPORT: 'export',
//   Object.values(ExpLocOptions),
// });

export const SalesOrderSchema = new Schema(
  {
    exportLocal: {
      type: String,
      enum: ['local', 'export'],
      default: 'local',
    },

    createdDate: { type: Date },
    soNumber: { type: String },
    remarks: { type: String },
    salesPic: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // sales pic - Ref BaseUser
    custNo: { type: String }, // customer number - Ref Customer
    custId: { type: mongoose.Schema.Types.ObjectId },
    custPoNum: { type: String },
    custName: { type: String },
    address: { type: String },
    telNo: { type: String },
    faxNo: { type: String },
    buyerName: { type: String },
    buyerEmail: { type: String },
    poNumber: { type: String },
    delAddress: { type: String },
    paymentAddress: { type: String },
    versionNum: { type: Number, default: 1 },
    quoRef: { type: String },
    discountAmt: { type: Number },
    subTotalAmt: { type: Number },
    gstAmt: { type: Number },

    // Check if SO generate WO
    toggleGenerateWO: { type: Boolean },

    // draft OR confirmed
    status: { type: String, default: 'draft' },
    // latestSalesOrder = true by default
    latestSalesOrder: { type: Boolean, default: 'true' },
    // Initial Version
    initialVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: false,
    },
    // quotation ID
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: false,
    },
    // incoterm - Dropdown
    incoterm: { type: mongoose.Schema.Types.ObjectId, ref: 'Incoterm' },
    // paymentTerm - Dropdown
    paymentTerm: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerm' },
    // currency - Dropdown
    currency: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
    currencyRate: { type: Number },
    // 4 fields - for REPORTING
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    downPayment: { type: Number, default: 0 },
    purchaseId: { type: mongoose.Schema.Types.ObjectId },
    discountName: { type: String },
    salesOrderItems: [
      {
        SN: { type: Number },
        uom: { type: mongoose.Schema.Types.ObjectId, ref: 'Uom' },
        sku: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku' },
        productId: { type: mongoose.Schema.Types.ObjectId },
        bom: { type: mongoose.Schema.Types.ObjectId, ref: 'Bom' },
        custRef: { type: String },
        description: { type: String },
        qty: { type: Number, default: 0 },
        unitPrice: { type: Number, default: 0 },
        extPrice: { type: Number, default: 0 },
      },
    ],
    profitDetails: [
      {
        sku: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku' },
        skuInfo: { type: String },
        qty: { type: Number },
        totalCost: { type: Number },
      },
    ],
    woStatus: { type: String }, // in progress, partial, complete
    doStatus: { type: String }, // pending, partial, complete
    doCount: { type: Number, default: 0 },

    leadTime: { type: String },
    deliveryRemark: { type: String },
    prices: { type: String },
    validity: { type: String },
    ciplNum: { type: String },
    internalRemarks: { type: String },
    freightAmount: { type: Number },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
    isPercentage: { type: Boolean },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

SalesOrderSchema.set('toJSON', { virtuals: true });
