// export class Cat {}
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const CustomerSchema = new Schema({
  cusNo: String,
  name: String,
  nickname: String,
  address: String,
  country: { type: Schema.Types.ObjectId, ref: 'Country' },
  tel1a: String,
  tel1b: String,
  fax1a: String,
  fax1b: String,
  cusPIC: String,
  cusPICtel1a: String,
  cusPICtel1b: String,
  cusPICMobile1a: String,
  cusPICMobile1b: String,
  cusPICEmail: String,
  acctPIC: String,
  acctPICtel1a: String,
  acctPICtel1b: String,
  acctPICMobile1a: String,
  acctPICMobile1b: String,
  acctPICEmail: String,
  billingAddress: String,
  billingCountry: { type: Schema.Types.ObjectId, ref: 'Country' },
  delAddress: String,
  salesPic: { type: Schema.Types.ObjectId, ref: 'User' },
  incoterm: { type: Schema.Types.ObjectId, ref: 'Incoterm' },
  creditLimit: { type: Schema.Types.ObjectId, ref: 'CreditLimit' },
  creditTerm: { type: Schema.Types.ObjectId, ref: 'CreditTerm' },
  downPayment: { type: Schema.Types.ObjectId, ref: 'DownPayment' },
  billingCurrency: { type: Schema.Types.ObjectId, ref: 'Currency' },
  paymentTerm: { type: Schema.Types.ObjectId, ref: 'PaymentTerm' },
  gstReq: { type: Schema.Types.ObjectId, ref: 'GstReq' },
});

CustomerSchema.set('toJSON', { virtuals: true });
