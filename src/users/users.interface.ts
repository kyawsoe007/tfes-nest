import { Document } from 'mongoose';

export interface User extends Document {
  checkPassword(password: string): Promise<boolean>;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile: string;
  roles: string[];
  access: string[];
  movement: Movement;
  roleId?: string;
  sub?: string;
  readonly _id?: string;
  readonly newPassword?: string;
  readonly confirmNewPassword?: string;
  isManager: boolean;
}

// export enum UserRole {
//   ADMIN = 'admin',
//   FINANCE = 'finance',
//   SALES = 'sales',
//   WAREHOUSE = 'warehouse',
// }
export enum Movement {
  IN = 'IN',
  AL = 'AL',
  RSV = 'RSV',
  VC = 'VC',
  MC = 'MC',
  OUT = 'OUT',
}
