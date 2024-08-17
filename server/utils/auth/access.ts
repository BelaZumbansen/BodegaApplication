import { Request, Response, NextFunction } from 'express'
import { AppError } from '../../services/appError';
import { findUserByEmail, requestPasswordResetToken, ResetPasswordInput, resetPassword } from '../../services/user';
import { TokenModel, IToken } from '../../models/token'
import { verifyJwt } from './jwt';
import jwt from 'jsonwebtoken'

export const resetPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
     try {
      const input : ResetPasswordInput = {
        userId: req.body.userId,
        token: req.body.token,
        newPassword: req.body.newPassword
      };
      
      resetPassword(input)
        .then(result => {
          if (result === undefined) {
            console.log("Reset Password successful for user: ", input.userId);
            res.status(200).send('Success');
          } else {
              // Handle specific error properties
              console.error(`Error ${result.internalError}`);
              return next(new AppError(result.appError, result.errorCode));
          }
        })
        .catch(error => {
          return next(new AppError('Unexpected Error while RequestPasswordResetToken:' + error, 400));
        });
    }
    catch (err:any) {
      res.status(400);
      res.json({message: 'Failed'});
    }
  }

export const requestPasswordResetTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
    try {
      const email = req.body.email;
      if (!email) {
        return next(new AppError('Missing Email', 400));
      }
      
      requestPasswordResetToken(email)
        .then(result => {
          if (result === undefined) {
              console.log("Request Password Reset Token successful for email: ", email);
              res.status(200).send('Success');
          } else {
              // Handle specific error properties
              console.error(`Error ${result.internalError}`);
              return next(new AppError(result.appError, result.errorCode));
          }
      })
      .catch(error => {
        return next(new AppError('Unexpected Error while RequestPasswordResetToken:' + error, 400));
      });
    }
    catch (err:any) {
      res.status(400);
      res.json({message: 'Failed'});
    }
  }

// Receive a Peristent Login Request
export const persistentLoginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction) => {

    try {

      const auth = req.cookies['accessToken'];

      if (!auth) {
        return next(new AppError('Missing Authorization Token', 401));
      }

      const verify = verifyJwt('accessTokenSecretKey', auth);
     
      if (!verify) {
        return next(new AppError('Invalid or Expired Access Token', 401)); 
      } else {

        const payload : jwt.JwtPayload = verify;
        const email = payload.sub;

        if (!email) {
          return next(new AppError('Invalid Access Token Payload', 401)); 
        }

        const user = await findUserByEmail(email);

        if (!user) {
          return next(new AppError('No User exists for given ID', 401));
        }

        res
        .status(200).json({
          user,
        });
      }
    } catch (err:any) {
      res.status(400);
      res.json({message: 'Failed'});
    }
  }

export const authorizeAPICall = async (
  req: Request,
  res: Response,
  next: NextFunction) => {

    try {

      const auth = req.headers ? req.headers.authorization : null;

      if (!auth) {
        return next(new AppError('Missing Authorization Token', 401));
      }
      
      const verify = verifyJwt('accessTokenSecretKey', auth);
      
      if (!verify) {
        return next(new AppError('Invalid or Expired Access Token', 401)); 
      } else {
        
        const payload : jwt.JwtPayload = verify;
        const email = payload.sub;

        if (!email) {
          return next(new AppError('Invalid Access Token Payload', 401)); 
        }

        const user = await findUserByEmail(email);

        if (!user) {
          return next(new AppError('No User exists for given ID', 401));
        }
      }
    } catch (err:any) {
      next(err);
    }

    return true;
  }