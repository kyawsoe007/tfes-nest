import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { jwtConstants } from '../constant';
import { cookieExtractor } from '../extractor/cookie-extractor';
import { JwtPayload } from './interfaces/jwtPayload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {
    super({
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      passReqToCallBack: true,
      // secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const userInfo = await this.usersService.findUserbyId(payload.sub);
    if (userInfo) {
      const userPayload = {
        email: userInfo.email,
        sub: userInfo._id,
        isManager: userInfo.isManager,
        iat: payload.iat,
        exp: payload.exp,
        access: userInfo.access,
      };

      return userPayload;
    }
  }
}
