import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountJournalDto } from './create-account-journal.dto';

export class UpdateAccountJournalDto extends PartialType(CreateAccountJournalDto) {}
