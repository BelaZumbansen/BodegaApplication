import { Request, Response, NextFunction } from 'express'
import { CreateUserInput, createUser, signToken } from '../../services/user'
import { AppError, UserRequestError } from '../../services/appError'
import { User } from '../../models/user'

// Handle Register Request
export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction ) => {

    try {
      const email = req.body.email;
      // Parse Request Payload
      const createCredentials : CreateUserInput = {
        email: email,
        password: req.body.password,
        displayName: req.body.displayName
      };

      // Attempt to create a new User
      const createResponse = await createUser(createCredentials)

      if (createResponse instanceof User) {
        const user = createResponse as User;
        
        // Generate an Access Token and Refresh Token for this User Session
        const { accessToken, refreshToken } = await signToken(user);
        // Send Response with Tokens
        res
        .status(200)
        .cookie('accessToken', accessToken, { httpOnly: true })
        .cookie('refreshToken', refreshToken, { httpOnly: true })
        .json({ user: user }); 
      }
      else {
        const error = createResponse as UserRequestError;
        console.log(error.internalError);
        return next(new AppError(error.appError, error.errorCode));
      }
    } catch (err : any) {
      console.log(`RegisterHandler::${err.message}`);
      next(new AppError('Unexpected error while registering new user.', 500));
    }
  }
