import {Document} from 'mongoose';

export interface PurchaseSetting extends Document{
    setting_name:string;
    account:string;
}