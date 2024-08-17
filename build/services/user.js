"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = exports.findUserById = exports.findUserByEmail = exports.createUser = exports.updateUser = exports.updateUserPassword = exports.resetPassword = exports.requestPasswordResetToken = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = require("../models/user");
const token_1 = require("../models/token");
const passwordService = __importStar(require("./password"));
const jwt_1 = require("../utils/auth/jwt");
const crypto_1 = require("crypto");
const bcrypt_2 = require("bcrypt");
const email_1 = require("./email");
const config = require('../config');
const UNEXPECTED_SERVER_ERROR = 'Unexpected server error encountered';
const requestPasswordResetToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, exports.findUserByEmail)(email);
    if (!user) {
        return {
            appError: "Could not find a user associated with this email.",
            internalError: "RequestPasswordResetToken::EmailNotAssociatedWithUser",
            errorCode: 400
        };
    }
    let token = yield token_1.TokenModel.findOne({ userId: user.userId });
    if (token) {
        yield token.deleteOne();
    }
    ;
    let resetToken = (0, crypto_1.randomBytes)(32).toString("hex");
    const hashedToken = yield (0, bcrypt_2.hash)(resetToken, Number(10));
    yield new token_1.TokenModel({
        userId: user.userId,
        token: hashedToken,
        createdAt: Date.now(),
    }).save();
    const link = `${process.env.CLIENT_URL}/passwordReset?token=${resetToken}&id=${user.userId}`;
    const emailHtml = yield (0, email_1.resetPasswordEmail)(email, link);
    if (!emailHtml) {
        return {
            appError: "Could not send email to user.",
            internalError: "RequestPasswordResetToken::FailedToGenerateHTMLTemplate",
            errorCode: 500
        };
    }
    (0, email_1.sendEmail)(user.email, "Bodega Password Reset Request", emailHtml).then(result => {
        if (result !== undefined) {
            return {
                appError: "Could not send email to user.",
                internalError: "RequestPasswordResetToken::SendEmailFailed",
                errorCode: 500
            };
        }
    });
});
exports.requestPasswordResetToken = requestPasswordResetToken;
const resetPassword = (input) => __awaiter(void 0, void 0, void 0, function* () {
    let passwordResetToken = yield token_1.TokenModel.findOne({ userId: input.userId });
    if (!passwordResetToken) {
        return {
            appError: "Invalid or expired password reset token.",
            internalError: "ResetPassword::Invalid or expired password reset token.",
            errorCode: 400
        };
    }
    const isValid = yield bcrypt_1.default.compare(input.token, passwordResetToken.token);
    if (!isValid) {
        return {
            appError: "Invalid or expired password reset token.",
            internalError: "ResetPassword::Invalid or expired password reset token.",
            errorCode: 400,
        };
    }
    try {
        const newHashPass = yield passwordService.hashPassword(input.newPassword);
        yield user_1.UserModel.updateOne({ _id: input.userId }, { $set: { password: newHashPass } }, { new: true });
    }
    catch (error) {
        return {
            appError: UNEXPECTED_SERVER_ERROR,
            internalError: `ResetPassword::${error}`,
            errorCode: 500
        };
    }
});
exports.resetPassword = resetPassword;
const updateUserPassword = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const userDoc = yield user_1.UserModel.findById(input.userId);
    if (!userDoc) {
        return {
            appError: UNEXPECTED_SERVER_ERROR,
            internalError: `Could not find a user by id ${input.userId} while updating password`,
            errorCode: 500
        };
    }
    if (!(yield passwordService.comparePassword(input.oldPassword, userDoc.password))) {
        return {
            appError: 'Previous password is incorrect. Please fix and try again.',
            internalError: 'UpdateUserPassword::PreviousPasswordIncorrect',
            errorCode: 400
        };
    }
    try {
        const newHashPass = yield passwordService.hashPassword(input.newPassword);
        userDoc.password = newHashPass;
        yield userDoc.update();
        return new user_1.User(userDoc);
    }
    catch (error) {
        return {
            appError: UNEXPECTED_SERVER_ERROR,
            internalError: `UpdateUserPassword::${error}`,
            errorCode: 500
        };
    }
});
exports.updateUserPassword = updateUserPassword;
const updateUser = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const userDoc = yield user_1.UserModel.findById(input.userId);
    if (!userDoc) {
        return {
            appError: UNEXPECTED_SERVER_ERROR,
            internalError: `Could not find a user by id ${input.userId} while updating user information`,
            errorCode: 500
        };
    }
    if (input.email !== userDoc.email) {
        const emailUser = yield user_1.UserModel.findOne({ email: input.email });
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
        const displayNameUser = yield user_1.UserModel.findOne({ displayName: input.displayName });
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
        yield userDoc.update();
        return new user_1.User(userDoc);
    }
    catch (error) {
        return {
            appError: UNEXPECTED_SERVER_ERROR,
            internalError: `UpdateUser::${error}`,
            errorCode: 500
        };
    }
});
exports.updateUser = updateUser;
const createUser = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const emailUser = yield user_1.UserModel.findOne({ email: input.email });
    if (emailUser) {
        return {
            appError: 'Email is already in use. Please fix and try again.',
            internalError: 'CreateUser::EmailAlreadyInUse',
            errorCode: 400
        };
    }
    const displayNameUser = yield user_1.UserModel.findOne({ displayName: input.displayName });
    if (displayNameUser) {
        return {
            appError: 'Display name is already in use. Please fix and try again.',
            internalError: 'CreateUser::DisplayNameAlreadyInUse',
            errorCode: 400
        };
    }
    try {
        const hashVal = yield passwordService.hashPassword(input.password);
        const userDoc = new user_1.UserModel({
            email: input.email,
            password: hashVal,
            displayName: input.displayName
        });
        yield userDoc.save();
        return new user_1.User(userDoc);
    }
    catch (error) {
        return {
            appError: UNEXPECTED_SERVER_ERROR,
            internalError: `CreateUser::${error}`,
            errorCode: 500
        };
    }
});
exports.createUser = createUser;
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Searching database for user with email:', email);
    const userDoc = yield user_1.UserModel.findOne({ email: email });
    if (!userDoc) {
        return null;
    }
    return new user_1.User(userDoc);
});
exports.findUserByEmail = findUserByEmail;
const findUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userDoc = yield user_1.UserModel.findById(userId);
    if (!userDoc) {
        return null;
    }
    return new user_1.User(userDoc);
});
exports.findUserById = findUserById;
// Sign Tokens for this User
const signToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    // Sign the Access Token
    const accessToken = (0, jwt_1.signJwt)('accessTokenSecretKey', { sub: user.email }, {
        expiresIn: `${config.jwt.accessTokenExpiresIn}m`
    });
    // Sign the Refresh Token
    const refreshToken = (0, jwt_1.signJwt)('refreshTokenSecretKey', { sub: user.email }, {
        expiresIn: `${config.jwt.refreshTokenExpiresIn}m`
    });
    // Return signed tokens
    return { accessToken, refreshToken };
});
exports.signToken = signToken;
