import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaveManagementDto } from './create-leave-management.dto';

export class UpdateLeaveManagementDto extends PartialType(CreateLeaveManagementDto) {}
