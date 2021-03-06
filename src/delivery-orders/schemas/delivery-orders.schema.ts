import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const DeliveryOrderSchema = new Schema(
  // Base Field
  {
    deliveryDate: { type: Date, default: new Date() },
    deliveryStatus: {
      type: String,
      default: 'draft',
    },
    deliveryNumber: {
      type: String, // AutoGenerated WO0001
    },
    timeRange: {
      type: String,
    },
    timeDelivery: {
      type: String,
    },
    deliveryAddress: {
      type: String,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
    remark: {
      type: String,
    },
    driver: {
      type: String,
    },
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    soDelRemark: {
      type: String,
    },
    ciplNum: {
      type: String,
    },
    soNumber: {
      type: String,
    },

    deliveryLines: [
      {
        // deliveryLineId: { type: mongoose.Schema.Types.ObjectId },
        // productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Future will be ref Product Object Id
        sku: { type: mongoose.Schema.Types.ObjectId },
        productId: { type: mongoose.Schema.Types.ObjectId },
        qty: { type: Number },
        deliveryQty: { type: Number, default: 0 },
        deliveryLineNum: { type: Number },
        deliveryLinesStatus: {
          type: String,
          enum: ['open', 'comfirmed', 'completed', 'cancelled'],
          default: 'open',
        },
        description: { type: String },
        // packingItemId: {
        //   type: mongoose.Schema.Types.ObjectId,
        // },
        // packNumber: { type: Number },
        woItemId: { type: mongoose.Schema.Types.ObjectId },
        // sku: { type: mongoose.Schema.Types.ObjectId, ref: 'Sku' },
        stockMove: { type: String }, //Future will be ref stock Object Id
        bom: { type: mongoose.Schema.Types.ObjectId },
        uom: { type: String },
      },
    ],
  },
  {
    timestamps: { createdAt: 'createdAt' },
    toJSON: { virtuals: true },
  },
);

DeliveryOrderSchema.set('toJSON', { virtuals: true });
