import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ExpensesClaimService } from './expenses-claim.service';
import { CreateExpensesClaimDto } from './dto/create-expenses-claim.dto';
import { UpdateExpensesClaimDto } from './dto/update-expenses-claim.dto';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
import { ExpensesClaim } from './expenses-claim.interface';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { FilterDto } from '../shared/filter.dto';
import { User } from '../users/users.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('expenses-claim')
@Controller('expenses-claim')
export class ExpensesClaimController {
  constructor(private readonly expensesClaimService: ExpensesClaimService) {}

  @Post()
  async create(
    @Body() createExpensesClaimDto: CreateExpensesClaimDto,
  ): Promise<ExpensesClaim> {
    return await this.expensesClaimService.create(createExpensesClaimDto);
  }

  @Get()
  async findAll(): Promise<ExpensesClaim[]> {
    return await this.expensesClaimService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<ExpensesClaim> {
    return await this.expensesClaimService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', new ValidateObjectId()) id: string,
    @Body() updateExpensesClaimDto: UpdateExpensesClaimDto,
    @AuthUser() user: User,
  ): Promise<ExpensesClaim> {
    return await this.expensesClaimService.update(
      id,
      updateExpensesClaimDto,
      user,
    );
  }

  @Delete(':id')
  async remove(@Param('id', new ValidateObjectId()) id: string): Promise<void> {
    return await this.expensesClaimService.remove(id);
  }

  // Find All + Filtered
  @Post('getfilters')
  async getfilters(@Body() query: FilterDto, @AuthUser() user: User) {
    const result = await this.expensesClaimService.getfilters(query, user);
    return result;
  }
}
