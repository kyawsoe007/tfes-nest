import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;
export const PackingListSchema = new Schema(
  // Base Field
  {
    // OperationId:{type:mongoose.Schema.Types.ObjectId,ref:'StockOperation'},
    deliveryId: { type: mongoose.Schema.Types.ObjectId },
    packingNum: { type: String },
    operationId: { type: String, default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
    soNumber: { type: String },
    packinglistStatus: {
      type: String,
      enum: ['open', 'draft', 'processing', 'completed'],
      default: 'draft',
    },
    pickedBy: { type: String }, // Future will be ref User Object Id
    workOrderId: { type: mongoose.Schema.Types.ObjectId },
    completedDate: { type: Date, default: new Date() },
    soDelRemark: { type: String },
    packItems: [
      {
        workItemId: { type: mongoose.Schema.Types.ObjectId },
        runningNum: { type: Number },
        packItemStatus: {
          type: String,
          enum: ['open', 'completed'],
          default: 'open',
        },
        measurement: { type: String },
        weight: { type: String },
        productId: { type: String },
        container: { type: String }, // Future will be ref User Object Id
        qty: { type: Number },
        sku: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku' },
        hsCode: { type: String },
        cooCode: { type: String },
        uom: { type: String },
      },
    ],
    packagingType: [
      {
        container: { type: String },
        measurement: { type: String },
        weight: { type: String },
        hsCode: { type: String },
        cooCode: { type: String },
      },
    ],
    hsCode: { type: String },
    cooCode: { type: String },
    remark: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt' },
    toJSON: { virtuals: true },
  },
);
