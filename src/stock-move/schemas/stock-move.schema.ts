import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const StockMoveSchema = new Schema(
  {
    //date
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },

    // Stock Operation Id
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockOperation',
      // required: true,
    },

    // Purchase Order Line number
    lineNumber: {
      type: Number,
    },

    lineNumberId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    skuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sku',
      // required: true,
    },

    // From Purchase Order
    description: {
      type: String,
    },

    // Destination Id
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockLocation',
      // required: true,
    },

    //estimate date. same as purchase order
    estimatedDate: {
      type: Date,
    },

    //Qty
    qty: {
      type: Number,
    },

    //done
    done: {
      type: Boolean,
    },

    //completed qty
    remainingQty: {
      type: Number,
    },

    //completed qty
    completedQty: {
      type: Number,
    },

    //completed date
    completedDate: {
      type: Date,
    },

    //original move id
    originalMoveId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

StockMoveSchema.set('toJSON', { virtuals: true });
