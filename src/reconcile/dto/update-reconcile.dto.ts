import { CreateReconcileDto } from './create-reconcile.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateReconcileDto extends PartialType(CreateReconcileDto) {}
