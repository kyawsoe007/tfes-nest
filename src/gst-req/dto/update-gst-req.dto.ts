import { PartialType } from '@nestjs/mapped-types';
import { CreateGstReqDto } from './create-gst-req.dto';

export class UpdateGstReqDto extends PartialType(CreateGstReqDto) {}
