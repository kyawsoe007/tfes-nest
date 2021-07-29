import { Document } from "mongoose";

export interface LeaveManagement extends Document {
    status?: string;
    number: string;
    type: string;
    reasons: string;
    offDays: string;
    employeeName: string;
    applyDate: Date;
    startDate: Date;
    endDate: Date;
    transferDate: Date;
}