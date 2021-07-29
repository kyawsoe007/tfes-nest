import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { SequenceSettingsService } from './sequence-settings.service';
import { CreateSequenceSettingDto } from './dto/create-sequence-setting.dto';
import { UpdateSequenceSettingDto } from './dto/update-sequence-setting.dto';
import { ApiTags } from '@nestjs/swagger';
import { SequenceSetting } from './sequence-settings.interface';

@ApiTags('sequence-settings')
@Controller('sequence-settings')
export class SequenceSettingsController {
  constructor(
    private readonly sequenceSettingsService: SequenceSettingsService,
  ) {}

  @Post()
  async create(
    @Body() createSequenceSettingDto: CreateSequenceSettingDto,
  ): Promise<SequenceSetting> {
    return await this.sequenceSettingsService.createNewSequence(
      createSequenceSettingDto,
    );
  }

  @Get()
  async findAll(): Promise<SequenceSetting[]> {
    const result = await this.sequenceSettingsService.findAll();
    if (result.length < 1) {
      throw new NotFoundException('Sequence data is empty');
    }
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SequenceSetting> {
    const result = await this.sequenceSettingsService.findOneSequenceById(id);
    if (!result) {
      throw new NotFoundException('Sequence not found!');
    }
    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSequenceSettingDto: UpdateSequenceSettingDto,
  ): Promise<SequenceSetting> {
    return await this.sequenceSettingsService.updateSequenceById(
      id,
      updateSequenceSettingDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    return await this.sequenceSettingsService.removeSequenceById(id);
  }
}
