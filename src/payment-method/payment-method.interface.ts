import { Document } from 'mongoose';

export interface PaymentMethod extends Document{
    name: string;
    account: any;
    journal: any;
    currency:any;
}
