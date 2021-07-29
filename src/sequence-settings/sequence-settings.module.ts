import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { SequenceSettingsService } from './sequence-settings.service';
import { SequenceSettingsController } from './sequence-settings.controller';
import { SequenceSettingSchema } from './schemas/sequence-settings.schema';

@Module({
  // Added new import
  imports: [
    MongooseModule.forFeature([
      { name: 'SequenceSetting', schema: SequenceSettingSchema },
    ]),
  ],
  controllers: [SequenceSettingsController],
  providers: [SequenceSettingsService],
  exports: [SequenceSettingsService],
})
export class SequenceSettingsModule {}
