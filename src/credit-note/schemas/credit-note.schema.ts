import * as mongoose from 'mongoose';
import { InvoiceStatusEnum } from 'src/invoices/dto/create-invoice.dto';
const Schema = mongoose.Schema;

export const CreditNoteSchema = new Schema(
  {
    createdDate: { type: Date },
    soNumber: { type: String },
    creditNoteNumber: { type: String },
    remarks: { type: String },
    account: { type: mongoose.Schema.Types.ObjectId }, // account - Ref BaseUser
    journal: { type: mongoose.Schema.Types.ObjectId },
    custNo: { type: String }, // customer number - Ref Customer
    custId: { type: mongoose.Schema.Types.ObjectId },
    custName: { type: String },
    address: { type: String },
    telNo: { type: String },
    faxNo: { type: String },
    buyerName: { type: String },
    buyerEmail: { type: String },
    delAddress: { type: String },
    paymentAddress: { type: String },
    versionNum: { type: Number, default: 1 },
    date: { type: Date},

    exportLocal: {
      type: String,
      enum: ['local', 'export'],
      default: 'local',
    },

    // Check if SO generate WO
    toggleGenerateWO: { type: Boolean },
    // Check if SO generate PO
    toggleGeneratePO: { type: Boolean },

    // draft OR confirmed
    status: { type: String, default: InvoiceStatusEnum.DRAFT},
    oldVersionList: { type: Array },
    // paymentTerm - Dropdown
    paymentTerm: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerm' },
    // currency - Dropdown
    currency: { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
    // 4 fields - for REPORTING
    discount: { type: Number },
    total: { type: Number },
    gst: { type: Number },
    gstAmount: {type: Number},
    downPayment: { type: Number },
    salesOrderItems: [
      {
        SN: { type: Number },
        bom: { type: mongoose.Schema.Types.ObjectId, ref: 'Bom' },
        description: { type: String },
        qty: { type: Number },
        unitPrice: { type: Number },
        extPrice: { type: Number },
        account: { type: mongoose.Schema.Types.ObjectId },
      },
    ],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

CreditNoteSchema.set('toJSON', { virtuals: true });
