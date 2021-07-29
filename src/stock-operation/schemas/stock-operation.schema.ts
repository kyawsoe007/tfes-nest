import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const StockOperationSchema = new Schema({
  // Move number
  moveNo: { type: String },

  // Stock Operation Type. default: incoming
  type: { type: String, default: 'incoming' },
  // Order No
  orderNo: { type: String },

  //Destination
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockLocation',
    required: false,
  },

  deliveryId: { type: mongoose.Schema.Types.ObjectId },

  // Status
  status: { type: String, default: 'open' },

  //created date
  createdDate: { type: Date, default: Date.now },

  //expected date
  expectedDate: { type: Date, default: Date.now },

  //completed date
  completedDate: { type: Date },
});

StockOperationSchema.set('toJSON', { virtuals: true });
