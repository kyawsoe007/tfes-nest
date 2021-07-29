// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SupplierSchema = new Schema({
  suppId: String,
  name: String,
  nickname: String,
  address: String,
  country: { type: Schema.Types.ObjectId, ref: 'Country' },
  tel1a: String,
  tel1b: String,
  fax1a: String,
  fax1b: String,
  salesPIC: String,
  salesPICtel1a: String,
  salesPICtel1b: String,
  salesPICMobile1a: String,
  salesPICMobile1b: String,
  salesPICEmail: String,
  acctPIC: String,
  acctPICtel1a: String,
  acctPICtel1b: String,
  acctPICMobile1a: String,
  acctPICMobile1b: String,
  acctPICEmail: String,
  delAddress: String,
  delCountry: { type: Schema.Types.ObjectId, ref: 'Country' },
  tfesPIC: { type: Schema.Types.ObjectId, ref: 'User' },
  incoterm: { type: Schema.Types.ObjectId, ref: 'Incoterm' },
  downPayment: { type: Schema.Types.ObjectId, ref: 'DownPayment' },
  gstReq: { type: Schema.Types.ObjectId, ref: 'GstReq' },
  billingCurrent: { type: Schema.Types.ObjectId, ref: 'Currency' },
});
SupplierSchema.set('toJSON', { virtuals: true });
