import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { User } from '../users/users.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: any, response: Response): Promise<any> {
    // sub: user._id used to hold our userId value compulsary by Nest.js

    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload);
    response.cookie('Authorization', accessToken, {
      // expires: new Date(Date.now() + 1 * 3600 * 6000), // 3hour
      expires: new Date(Date.now() + 1 * 3600000 * 24 * 7), // 7days
      httpOnly: true,
      secure: false,
    });
    user.movement = 'IN';
    await this.usersService.update(user._id, user);
    const userObject = {
      email: user.email,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      roles: user.roles,
      access: user.access,
      movement: user.movement,
      isManager: user.isManager,
      expires: new Date(Date.now() + 1 * 3600000 * 24 * 7).getTime(),
    };

    return userObject;
  }

  // Method call from local.strategy when User loggingIn
  async validateUserByPassword(email: string, password: string): Promise<User> {
    const userFound = await this.usersService.findOneByEmail(email);

    // Ensure user exist and password matched
    // CheckPassword method call from userSchema
    if (userFound) {
      const isMatch = await bcrypt.compare(password, userFound.password);
      if (isMatch) {
        return userFound;
      }
      throw new BadRequestException('invalid password');
    }
  }
}
