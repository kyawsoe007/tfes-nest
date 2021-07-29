import { CreateCreditNoteDto } from './create-credit-note.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateCreditNoteDto extends PartialType(CreateCreditNoteDto) {}
