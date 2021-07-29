import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const PaymentDepositSchema = new Schema(
  {
    createdDate: { type: Date },
    soNumber: { type: String },
    depositNumber: { type: String },
    remarks: { type: String },
    salesPic: { type: String }, // sales pic - Ref BaseUser
    suppNo: { type: String }, // customer number - Ref Customer
    suppId: { type: mongoose.Schema.Types.ObjectId },
    custNo: { type: String },
    custId: { type: String},
    depositType: { type: String ,
      enum: ['customer', 'supplier'],
    },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem'},
    journal: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountJournal' },
    suppName: { type: String },
    custName: { type: String },
    address: { type: String },
    telNo: { type: String },
    faxNo: { type: String },
    buyerName: { type: String },
    buyerEmail: { type: String },
    delAddress: { type: String },
    paymentAddress: { type: String },
    versionNum: { type: Number, default: 1 },
    invoiceDate:{type:Date},
    exportLocal: {
      type: String,
      enum: ['local', 'export'],
      default: 'local',
    },

    // draft OR confirmed
    status: { type: String, default: 'draft' },
    oldVersionList: { type: Array },
    // paymentTerm - Dropdown
    paymentTerm: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerm' },
    // currency - Dropdown
    currency: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
    // 4 fields - for REPORTING
    discount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
    discountAmount: { type: Number },
    total: { type: Number },
    grandTotal: { type: Number },
    gst: { type: Number },
    downPayment: { type: Number },
    salesOrderItems: [
      {
        SN: { type: Number },        
        description: { type: String },
        qty: { type: Number },
        unitPrice: { type: Number },
        extPrice: { type: Number },
        expenseType: { type: String },
        account: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountItem'}
      },
    ],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

PaymentDepositSchema.set('toJSON', { virtuals: true });
