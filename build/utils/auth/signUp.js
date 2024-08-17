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
exports.registerHandler = void 0;
const user_1 = require("../../services/user");
const appError_1 = require("../../services/appError");
const user_2 = require("../../models/user");
// Handle Register Request
const registerHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        // Parse Request Payload
        const createCredentials = {
            email: email,
            password: req.body.password,
            displayName: req.body.displayName
        };
        // Attempt to create a new User
        const createResponse = yield (0, user_1.createUser)(createCredentials);
        if (createResponse instanceof user_2.User) {
            const user = createResponse;
            // Generate an Access Token and Refresh Token for this User Session
            const { accessToken, refreshToken } = yield (0, user_1.signToken)(user);
            // Send Response with Tokens
            res
                .status(200)
                .cookie('accessToken', accessToken, { httpOnly: true })
                .cookie('refreshToken', refreshToken, { httpOnly: true })
                .json({ user: user });
        }
        else {
            const error = createResponse;
            console.log(error.internalError);
            return next(new appError_1.AppError(error.appError, error.errorCode));
        }
    }
    catch (err) {
        console.log(`RegisterHandler::${err.message}`);
        next(new appError_1.AppError('Unexpected error while registering new user.', 500));
    }
});
exports.registerHandler = registerHandler;
