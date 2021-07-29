import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const LeaveManagementSchema = new Schema(
    {
        number: { type: String },
        type: { type: String },
        reasons: { type: String },
        offDays: { type: String },
        applyDate: { type: Date },
        startDate: { type: Date },
        endDate: { type: Date },
        transferDate: { type: Date },
        status: { type: String, default: 'draft' },
        employeeName: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeSetting' }

    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    },
);
LeaveManagementSchema.set('toJSON', { virtuals: true });