// export class Cat {}
import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const ProductsSchema = new Schema(
  {
    partNumber: String,
    description: String,
    averagePrice: { type: Number, default: 0 },
    listPrice: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    remarks: String,
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    grpOne: { type: Schema.Types.ObjectId, ref: 'GrpOne' },
    grpTwo: { type: Schema.Types.ObjectId, ref: 'GrpTwo' },
    currency: { type: Schema.Types.ObjectId, ref: 'Currency' },
    selOne: { type: String },
    selTwo: { type: String },
    size: { type: Schema.Types.ObjectId, ref: 'Size' },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    uom: { type: Schema.Types.ObjectId, ref: 'Uom' },
    supp1: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supp2: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supp3: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supp4: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supp5: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    bom: { type: Schema.Types.ObjectId, ref: 'Bom' },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    isFreight: { type: Boolean, default: false },
  },
  { minimize: false },
);
ProductsSchema.set('toJSON', { virtuals: true });
