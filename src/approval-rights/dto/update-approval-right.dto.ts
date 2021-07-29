import { PartialType } from '@nestjs/mapped-types';
import { CreateApprovalRightDto } from './create-approval-right.dto';

export class UpdateApprovalRightDto extends PartialType(CreateApprovalRightDto) {}
