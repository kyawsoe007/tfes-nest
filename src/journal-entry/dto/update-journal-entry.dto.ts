import { PartialType } from '@nestjs/swagger';
import {CreateJournalEntryDto} from './create-journal-entry.dto';

export class UpdateJournalEntryDto extends PartialType(CreateJournalEntryDto){}
