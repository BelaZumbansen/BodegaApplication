import bcrypt from 'bcrypt'
import { model, Schema, Model, Document } from 'mongoose'
import { UserModel, User, IUser } from '../models/user'
import { TokenModel, IToken } from '../models/token'
import * as passwordService from './password'
import { signJwt } from '../utils/auth/jwt'
import { randomBytes } from 'crypto'
import { hash } from 'bcrypt'
import { UserRequestError, InternalRequestError } from './appError'
import { sendEmail, resetPasswordEmail } from './email'
const config = require('../config');

const UNEXPECTED_SERVER_ERROR : string = 'Unexpected server error encountered';

export interface ResetPasswordInput {
  userId: string,
  token: string,
  newPassword: string,
}

export interface CreateUserInput {
  email: string,
  password: string,
  displayName: string
}

export interface LoginInput {
  email: string,
  password: string
}

export interface UpdateUserInformationInput {
  userId: string,
  email: string,
  displayName: string,
  firstName: string,
  lastName: string,
  biography: string
}

export interface UpdatePasswordInput {
  userId: string,
  oldPassword: string,
  newPassword: string
}

export const requestPasswordResetToken = async (email : string) : Promise<void | UserRequestError> => {

  const user = await findUserByEmail(email);
  if (!user) {
    return {
      appError: "Could not find a user associated with this email.",
      internalError: "RequestPasswordResetToken::EmailNotAssociatedWithUser",
      errorCode: 400
    };
  }

  let token = await TokenModel.findOne({ userId: user.userId });
  if (token) {
    await token.deleteOne();
  };

  let resetToken = randomBytes(32).toString("hex");
  
  const hashedToken = await hash(resetToken, Number(10));
  await new TokenModel({
    userId: user.userId,
    token: hashedToken,
    createdAt: Date.now(),
  }).save();

  const link = `${process.env.CLIENT_URL}/passwordReset?token=${resetToken}&id=${user.userId}`;
  const emailHtml = await resetPasswordEmail(email, link);
  if (!emailHtml) {
    return {
      appError: "Could not send email to user.",
      internalError: "RequestPasswordResetToken::FailedToGenerateHTMLTemplate",
      errorCode: 500
    };
  }

  sendEmail(
    user.email,
    "Bodega Password Reset Request",
    emailHtml
  ).then(result => {
    if (result !== undefined) {
      return {
        appError: "Could not send email to user.",
        internalError: "RequestPasswordResetToken::SendEmailFailed",
        errorCode: 500
      };
    }
  });
};

export const resetPassword = async (input : ResetPasswordInput) : Promise<void | UserRequestError> => {
  let passwordResetToken = await TokenModel.findOne({ userId: input.userId });
  if (!passwordResetToken) {
    return {
      appError: "Invalid or expired password reset token.",
      internalError: "ResetPassword::Invalid or expired password reset token.",
      errorCode: 400
    };
  }

  const isValid = await bcrypt.compare(input.token, passwordResetToken.token);
  if (!isValid) {
    return {
      appError: "Invalid or expired password reset token.",
      internalError: "ResetPassword::Invalid or expired password reset token.",
      errorCode: 400,
    };
  }

  passwordResetToken.deleteOne();
  try {
    const newHashPass = await passwordService.hashPassword(input.newPassword);
    await UserModel.updateOne(
      { _id: input.userId },
      { $set: { password: newHashPass }},
      { new: true}
    );
  }
  catch (error) {
    return {
      appError: UNEXPECTED_SERVER_ERROR,
      internalError: `ResetPassword::${error}`,
      errorCode: 500
    }
  }
}

export const updateUserPassword = async (input : UpdatePasswordInput) : Promise<User | UserRequestError> => {

  const userDoc = await UserModel.findById(input.userId);
  if (!userDoc) {
    return {
      appError: UNEXPECTED_SERVER_ERROR,
      internalError: `Could not find a user by id ${input.userId} while updating password`,
      errorCode: 500
    };
  }

  if (!(await passwordService.comparePassword(input.oldPassword, userDoc.password))) {
    return {
      appError: 'Previous password is incorrect. Please fix and try again.',
      internalError: 'UpdateUserPassword::PreviousPasswordIncorrect',
      errorCode: 400
    };
  }

  try {
    const newHashPass = await passwordService.hashPassword(input.newPassword);
    userDoc.password = newHashPass;
    await userDoc.update();
    return new User(userDoc);
  }
  catch (error) {
    return {
      appError: UNEXPECTED_SERVER_ERROR,
      internalError: `UpdateUserPassword::${error}`,
      errorCode: 500
    }
  }
}

export const updateUser = async (input : UpdateUserInformationInput) : Promise<User | UserRequestError> => {

  const userDoc = await UserModel.findById(input.userId);
  if (!userDoc) {
    return {
      appError: UNEXPECTED_SERVER_ERROR,
      internalError: `Could not find a user by id ${input.userId} while updating user information`,
      errorCode: 500
    };
  } 

  if (input.email !== userDoc.email) {
    const emailUser = await UserModel.findOne({email : input.email});
    if (emailUser) {
      return {
        appError: 'Email is already in use. Please fix and try again.',
        internalError: 'UpdateUser::EmailAlreadyInUse',
        errorCode: 400
      };
    }
    userDoc.email = input.email;
  }

  if (input.displayName != userDoc.displayName) {
    const displayNameUser = await UserModel.findOne({ displayName : input.displayName});
    if (displayNameUser) {
      return {
        appError: 'Display name is already in use. Please fix and try again.',
        internalError: 'UpdateUser::DisplayNameAlreadyInUse',
        errorCode: 400
      };
    }
    userDoc.displayName = input.displayName;
  }

  userDoc.firstName = input.firstName;
  userDoc.lastName = input.lastName;
  userDoc.biography = input.biography;
  try {
    await userDoc.update();
    return new User(userDoc);
  }
  catch (error) {
    return {
      appError: UNEXPECTED_SERVER_ERROR,
      internalError: `UpdateUser::${error}`,
      errorCode: 500
    }
  }
}

export const createUser = async (input : CreateUserInput) : Promise<User | UserRequestError> =>  {
  
  const emailUser = await UserModel.findOne({email: input.email});
  if (emailUser) {
    return {
      appError: 'Email is already in use. Please fix and try again.',
      internalError: 'CreateUser::EmailAlreadyInUse',
      errorCode: 400
    };
  }

  const displayNameUser = await UserModel.findOne({displayName : input.displayName });
  if (displayNameUser) {
    return {
      appError: 'Display name is already in use. Please fix and try again.',
      internalError: 'CreateUser::DisplayNameAlreadyInUse',
      errorCode: 400
    };
  }

  try {
    const hashVal = await passwordService.hashPassword(input.password);
    const userDoc = new UserModel({
      email: input.email,
      password: hashVal,
      displayName: input.displayName
    });
  
    await userDoc.save();
    return new User(userDoc);
  }
  catch (error) {
    return {
      appError: UNEXPECTED_SERVER_ERROR,
      internalError: `CreateUser::${error}`,
      errorCode: 500
    }
  }
};

export const findUserByEmail = async (email : string) => {
  console.log('Searching database for user with email:', email);
  const userDoc = await UserModel.findOne({ email : email });
  if (!userDoc) {
    return null;
  }

  return new User(userDoc);
}

export const findUserById = async (userId : string) => {

  const userDoc = await UserModel.findById(userId);
  if (!userDoc) {
    return null;
  }

  return new User(userDoc);
}

// Sign Tokens for this User
export const signToken = async (user: User) => {

  // Sign the Access Token
  const accessToken = signJwt(
    'accessTokenSecretKey',
    { sub: user.email },
    {
      expiresIn: `${config.jwt.accessTokenExpiresIn}m`
    }
  );

  // Sign the Refresh Token
  const refreshToken = signJwt(
    'refreshTokenSecretKey',
    { sub: user.email },
    {
      expiresIn: `${config.jwt.refreshTokenExpiresIn}m`
    }
  );
  
  // Return signed tokens
  return { accessToken, refreshToken }
};

