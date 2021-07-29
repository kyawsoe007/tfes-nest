import { IntersectionType, PartialType } from '@nestjs/swagger';
import { CreatePackingListDto } from './create-packing-list.dto';

export class UpdatePackingListDto extends PartialType(CreatePackingListDto) {}
