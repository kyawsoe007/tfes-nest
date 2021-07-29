import { Document } from 'mongoose';

export interface AccessRight extends Document {
  readonly name: string;
  readonly access: string[];
  readonly isManager: boolean;
}
