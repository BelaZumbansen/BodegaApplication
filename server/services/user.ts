import bcrypt from 'bcrypt'
import { model, Schema, Model, Document } from 'mongoose'
import { UserModel, User, IUser } from '../models/user'
import * as passwordService from './password'
import { signJwt } from '../utils/auth/jwt'
const config = require('../config');

const UNEXPECTED_SERVER_ERROR : string = 'Unexpected server error encountered';

export interface Error {
  appError: string,
  internalError: string,
  errorCode: number
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

export const updateUserPassword = async (input : UpdatePasswordInput) : Promise<User | Error> => {

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

export const updateUser = async (input : UpdateUserInformationInput) : Promise<User | Error> => {

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

export const createUser = async (input : CreateUserInput) : Promise<User | Error> =>  {
  
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

