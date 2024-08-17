"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = exports.logoutHandler = void 0;
const user_1 = require("../../services/user");
const password_1 = require("../../services/password");
const appError_1 = require("../../services/appError");
// Handle Logout API Request
const logoutHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged Out' });
});
exports.logoutHandler = logoutHandler;
// Handle Login API Request
const loginHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Parse Fields
        const email = req.body.email;
        const password = req.body.password;
        if (!email || !password) {
            return next(new appError_1.AppError('Email or password field undefined.', 400));
        }
        const user = yield (0, user_1.findUserByEmail)(email);
        if (!user) {
            return next(new appError_1.AppError('Invalid email. No user found.', 400));
        }
        // Check credentials
        if (!(yield (0, password_1.comparePassword)(password, user.hashPass))) {
            return next(new appError_1.AppError('Incorrect password', 401));
        }
        // Generate an Access Token and a Refresh Token
        const { accessToken, refreshToken } = yield (0, user_1.signToken)(user);
        // Configure Response with Authentication Tokens
        res
            .status(200)
            .cookie('accessToken', accessToken, { httpOnly: true })
            .cookie('refreshToken', refreshToken, { httpOnly: true })
            .json({ user: user });
    }
    catch (err) {
        console.log(`RegisterHandler::${err.message}`);
        next(new appError_1.AppError('Unexpected error while logging in user.', 500));
    }
});
exports.loginHandler = loginHandler;
