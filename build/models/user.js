"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
// Define User Schema
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 255
    },
}, {
    strictQuery: true,
});
// Compile User Model
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
class User {
    constructor(userDoc) {
        this.email = userDoc.email;
        this.hashPass = userDoc.password;
    }
}
exports.User = User;
