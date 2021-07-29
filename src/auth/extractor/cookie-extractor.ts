import { Request } from 'express';

export const cookieExtractor = (request: Request) => {
  let access_token = null;
  if (request && request.cookies) {
    access_token = request.cookies['Authorization'];
  }

  return access_token;
};
