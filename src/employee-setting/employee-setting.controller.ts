import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmployeeSettingService } from './employee-setting.service';
import { CreateEmployeeSettingDto } from './dto/create-employee-setting.dto';
import { UpdateEmployeeSettingDto } from './dto/update-employee-setting.dto';
import { ApiTags } from '@nestjs/swagger';
import { FilterDto } from 'src/shared/filter.dto';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { User } from 'src/users/users.interface';

@ApiTags('Employee-Setting')
@Controller('employee-setting')
export class EmployeeSettingController {
  constructor(private readonly employeeSettingService: EmployeeSettingService) { }

  @Post()
  create(@Body() createEmployeeSettingDto: CreateEmployeeSettingDto) {
    return this.employeeSettingService.create(createEmployeeSettingDto);
  }

  // Find All + Filtered
  @Post('getfilters')
  async getfilters(@Body() query: FilterDto,@AuthUser() user:User) {
    const result = await this.employeeSettingService.getfilters(query,user);
    return result;
  }

  @Get()
  findAll() {
    return this.employeeSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeSettingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeSettingDto: UpdateEmployeeSettingDto) {
    return this.employeeSettingService.update(id, updateEmployeeSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeSettingService.remove(id);
  }
}
