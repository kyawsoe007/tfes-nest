import { ApiProperty } from '@nestjs/swagger';

export class CreateExpensesClaimDto {
  @ApiProperty()
  status: string;
  @ApiProperty()
  createdDate: Date;
  @ApiProperty()
  claimNo: string;
  @ApiProperty()
  userClaim: string;
  @ApiProperty()
  getApproval: boolean;
  @ApiProperty()
  remark: string;
  @ApiProperty({ type: () => [ClaimItemsDto] })
  claimItems: ClaimItemsDto[];
  @ApiProperty()
  approvedBy: string;
  @ApiProperty()
  files: string;
}

export class ClaimItemsDto {
  @ApiProperty()
  lineNum: number;
  @ApiProperty()
  date: Date;
  @ApiProperty()
  description: string;
  @ApiProperty()
  claimType: string;
  @ApiProperty()
  amount: number;
  @ApiProperty()
  gstAmt: number;
  @ApiProperty()
  currency: string;
  @ApiProperty()
  currencyRate: number;
  @ApiProperty()
  adminRemark: string;
}

export enum ExpClaimStatusEnumDto {
  DRAFT = 'draft',
  WAITING_APPROVAL = 'waiting-approval',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}
