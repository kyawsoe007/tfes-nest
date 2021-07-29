import { CreateDebitNoteDto } from './create-debit-note.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateDebitNoteDto extends PartialType(CreateDebitNoteDto) {}