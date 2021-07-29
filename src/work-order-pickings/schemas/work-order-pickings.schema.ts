import * as mongoose from 'mongoose';
import { WorkOrderPicking } from '../work-order-pickings.interface';
const Schema = mongoose.Schema;

export const WorkOrderPickingSchema = new Schema(
  // Base Field
  {
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
    woItemId: { type: mongoose.Schema.Types.ObjectId },
    woPickingStatus: { type: String, default: 'open' },
    // woItemNum: { type: String },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    skuId: { type: mongoose.Schema.Types.ObjectId },
    pickedSkuId: { type: mongoose.Schema.Types.ObjectId },
    workQty: { type: Number, default: 0 },
    runningNum: { type: Number },
    checkConfirmWoItem: { type: Boolean, default: false },
    partialCount: { type: Number }, // cannot default
    bomQtyInput: { type: Number },
  },
  {
    toJSON: { virtuals: true },
  },
);

WorkOrderPickingSchema.pre<WorkOrderPicking>('save', function (next) {
  const formattedWorkQty = +this.workQty.toFixed(4);
  this.workQty = formattedWorkQty;
  return next();
});
