import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Req,
  Param,
  Patch,
  BadRequestException,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UserRole } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { Response, Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangePasswordUserDto } from './dto/change-password-user.dto';
import { Public } from '../shared/decorators/public-guard.decorator';
import { AccessRolesService } from '../access-roles/access-roles.service';
import { ValidateObjectId } from '../shared/validate-object-id.pipes';
//import { Roles } from '../shared/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly accessRolesService: AccessRolesService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() request: Request, @Res() response: Response) {
    const userInfo = await this.authService.login(request.user, response);

    return response.status(HttpStatus.OK).json({
      message: 'Login Successful!',
      userInfo,
    });
  }

  @Public()
  @Post('logout')
  async logout(@Res() response: Response) {
    response.clearCookie('Authorization');

    return response.status(HttpStatus.OK).json({
      message: 'Logout Successfully!',
    });
  }

  @ApiOperation({ description: 'Access your own profile' })
  @Get('myProfile')
  async getMyProfile(@Req() request: Request): Promise<any> {
    // console.log('what is request', request.user);
    return await this.usersService.getMyProfile(request.user);
  }

  @ApiOperation({ description: 'Update your own profile' })
  @Patch('myProfile-update')
  async getMyProfileUpdate(
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ): Promise<any> {
    // console.log('what is request', request.user);
    return await this.usersService.getMyProfileUpdate(
      request.user,
      updateUserDto,
    );
  }

  @ApiOperation({ description: 'To Change Password' })
  @UseGuards(LocalAuthGuard)
  @Patch('change-password')
  async changePassword(
    @Body() changePasswordUserDto: ChangePasswordUserDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    console.log('what is changepassword', changePasswordUserDto);

    if (
      changePasswordUserDto.newPassword !==
      changePasswordUserDto.confirmNewPassword
    ) {
      throw new BadRequestException('Passwords do not match');
    } else if (
      changePasswordUserDto.password === changePasswordUserDto.newPassword
    ) {
      throw new BadRequestException(
        'Current password should not be same with new password',
      );
    }

    await this.usersService.changePassword(
      request.user,
      changePasswordUserDto,
      response,
    );

    return response.status(HttpStatus.OK).json({
      message: 'Update Password has been Successful!',
    });
  }

  @ApiOperation({ description: 'Admin to register on behalf of employee' })
  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  @ApiOperation({ description: 'Admin to find a employee' })
  @Get('get-user/:id')
  findUserbyId(@Req() @Param('id') id: string) {
    return this.usersService.findUserbyId(id);
  }

  // @Roles(UserRole.ADMIN)
  @ApiOperation({ description: 'Admin to find all employees' })
  @Get('findAllUsers')
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ description: 'Admin to update employees profile' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // miscellaneous
  @Get('findAllPics')
  findAllPic() {
    return this.usersService.findAllPic();
  }

  @Get('findOnePics/:id')
  findOnePic(@Param('id') id: string) {
    return this.usersService.findOnePic(id);
  }

  @Delete(':id')
  async removeUser(
    @Param('id', new ValidateObjectId()) id: string,
  ): Promise<void> {
    const user = this.usersService.findUserbyId(id);
    if (user) {
      await this.accessRolesService.removeAllByUserId(id);
      return await this.usersService.removeUser(id);
    } else {
      throw new NotFoundException('User not found');
    }
  }
}
