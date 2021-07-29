import { PartialType } from '@nestjs/mapped-types';
import { CreateCapexManagementDto } from './create-capex-management.dto';

export class UpdateCapexManagementDto extends PartialType(CreateCapexManagementDto) {}
