import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const PurchaseSchema = new Schema(
  {
    createdDate: { type: Date },

    // // PO number
    poNumber: { type: String },

    // sales pic - Ref BaseUser
    purchasePic: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // supplier number - Ref supplier
    suppNo: { type: String },

    // supplier name
    name: { type: String },

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

    // Supplier Ref
    suppRef: { type: String },

    // delivery address
    delAddress: { type: String },

    // delivery date
    delDate: { type: Date },

    // remarks address
    remarks: { type: String },

    status: { type: String, default: 'draft' },

    // Approval
    isApprove: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purchaseType: { type: String },

    // incoterm - Dropdown
    incoterm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incoterm',
      required: false,
    },

    exportLocal: { type: String },

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
    discount: { type: Number },
    discountAmount: { type: Number },
    //subtotal is after discount
    subTotal: { type: Number },
    //total is total of lines
    total: { type: Number },
    gst: { type: Number },
    gstAmount: { type: Number },
    downPayment: { type: Number },

    // Purchase order line
    purchaseOrderItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        SN: { type: Number },
        suppRef: { type: String },
        description: { type: String },
        qty: { type: Number },
        unitPrice: { type: Number },
        extPrice: { type: Number },
        uom: { type: mongoose.Schema.Types.ObjectId, ref: 'Uom' },
      },
    ],

    quoRef: { type: String },
    internalRemarks: { type: String },
    salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
    invStatus: { type: String }, // "Invoiced"
    discountName: { type: String },
    isPercentage: { type: Boolean },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

PurchaseSchema.set('toJSON', { virtuals: true });
