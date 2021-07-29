import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  FINANCE = 'finance',
  SALES = 'sales',
  OPSMANAGER = 'ops_manager',
  DIRECTOR = 'director',
}
export enum Movement {
  IN = 'IN',
  AL = 'AL',
  RSV = 'RSV',
  VC = 'VC',
  MC = 'MC',
  OUT = 'OUT',
}
export class CreateUserDto {
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  password: string;
  @ApiProperty()
  roles: string[];
  @ApiProperty()
  movement: Movement;
  access: string[]; // no need from user input
  @ApiProperty()
  mobile: string;

  isManager: boolean;
}
