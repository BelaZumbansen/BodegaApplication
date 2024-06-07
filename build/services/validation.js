"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserInformation = void 0;
function validateUserInformation(email, password) {
    const emailValid = email && email.includes('@') && email.length >= 5;
    const passwordValid = password.length >= 8 && /\d/.test(password) && /\w/.test(password);
    ;
    return emailValid && passwordValid;
}
exports.validateUserInformation = validateUserInformation;
