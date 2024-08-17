import { Request, Response, NextFunction } from 'express'
import { LoginInput, signToken, findUserByEmail } from '../../services/user'
import { comparePassword } from '../../services/password';
import { AppError } from '../../services/appError'

// Handle Logout API Request
export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction) => {
    
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({message : 'Logged Out'});
  }

// Handle Login API Request
export const loginHandler = async (
  req: Request, 
  res: Response,
  next: NextFunction ) => {

  try {

    // Parse Fields
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return next(new AppError('Email or password field undefined.', 400));
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return next(new AppError('Invalid email. No user found.', 400));
    }

    // Check credentials
    if (!(await comparePassword(password, user.hashPass))) {
        return next(new AppError('Incorrect password', 401));
    }

    // Generate an Access Token and a Refresh Token
    const { accessToken, refreshToken } = await signToken(user);

    // Configure Response with Authentication Tokens
    res
    .status(200)
    .cookie('accessToken', accessToken, { httpOnly: true })
    .cookie('refreshToken', refreshToken, { httpOnly: true })
    .json({ user: user }); 
  } catch (err : any) {
    console.log(`RegisterHandler::${err.message}`);
    next(new AppError('Unexpected error while logging in user.', 500));
  }
}

