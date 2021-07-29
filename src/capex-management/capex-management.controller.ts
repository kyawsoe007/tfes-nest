import { CapexManagement } from './capex-management.interface';
import { Controller, Get, Post, Body, Put, Param, Delete, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CapexManagementService } from './capex-management.service';
import { CreateCapexManagementDto } from './dto/create-capex-management.dto';
import { UpdateCapexManagementDto } from './dto/update-capex-management.dto';
@ApiTags('CapexMangements')
@Controller('capex-management')
export class CapexManagementController {
  constructor(private readonly capexManagementService: CapexManagementService) {}

  @Post()
  async create(@Body() createCapexManagementDto: CreateCapexManagementDto) {
    const result=await this.capexManagementService.create(createCapexManagementDto);
    return result;
  }

  @Get()
  async findAll(): Promise<CapexManagement[]> {
    const result =await this.capexManagementService.findAll();
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string
  ): Promise<CapexManagement> {
    const result=await this.capexManagementService.findOne(id);
    return result;
  }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateCapexManagementDto: UpdateCapexManagementDto
    ): Promise<CapexManagement> {
    const result=await this.capexManagementService.update(id, updateCapexManagementDto);
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result=await this.capexManagementService.remove(id);
    return result;
  }
}
