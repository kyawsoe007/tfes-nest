import { Document } from 'mongoose';

export interface AccessRole extends Document {
  readonly user: string;
  readonly role: string;
}
