import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierReconcileDto } from './create-supplier-reconcile.dto';

export class UpdateSupplierReconcileDto extends PartialType(CreateSupplierReconcileDto) {}
