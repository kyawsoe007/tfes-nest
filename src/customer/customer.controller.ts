import { ValidateObjectId } from './../shared/validate-object-id.pipes';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FilterDto } from '../shared/filter.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { User } from '../users/users.interface';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Post('getfilters')
  findAll(@Body() query: FilterDto, @AuthUser() user: User) {
    return this.customerService.findAll(query, user);
  }

  @Get('getAllDetails')
  getAllCustomerDropdownGroup() {
    return this.customerService.getAllCustomerDropdownGroup();
  }

  @Get(':id')
  findOne(@Param('id', new ValidateObjectId()) id: string) {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
