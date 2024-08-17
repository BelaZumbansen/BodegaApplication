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
    displayName: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 255
    },
    firstName: {
        type: String,
        required: false,
        minLength: 0,
        maxLength: 20
    },
    lastName: {
        type: String,
        required: false,
        minLength: 0,
        maxLength: 20
    },
    biography: {
        type: String,
        required: false,
        minLength: 0,
        maxLength: 150
    },
}, {
    strictQuery: true,
});
// Compile User Model
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
class User {
    constructor(userDoc) {
        this.userId = userDoc._id;
        this.email = userDoc.email;
        this.hashPass = userDoc.password;
        this.displayName = userDoc.displayName;
        this.firstName = userDoc.firstName;
        this.lastName = userDoc.lastName;
        this.biography = userDoc.biography;
    }
}
exports.User = User;
