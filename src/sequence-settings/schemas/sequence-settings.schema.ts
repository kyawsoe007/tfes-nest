import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const SequenceSettingSchema = new Schema({
  prefix: {
    type: String,
    required: true,
  },
  suffix: {
    type: String,
    required: false,
  },
  numDigits: {
    type: Number,
    required: false,
  },
  nextNumber: {
    type: Number,
    required: false,
  },
  modelName: {
    type: String,
    required: true,
  },
  year: {
    type: Boolean,
    default: false,
  },
});
