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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordEmail = exports.sendEmail = void 0;
const nodemailer = __importStar(require("nodemailer"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const createEmail = (subject, payload) => {
    return `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
      </head>
      <body>
        <h1>${subject}</h1>
        <p>${payload}</p>
      </body>
    </html> 
  `;
};
const sendEmail = (email, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // create reusable transporter object using the default SMTP transport
        console.log(`Creating Nodemailer Transport using ${process.env.EMAIL_USERNAME} at ${process.env.EMAIL_HOST}`);
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to: email,
            subject: subject,
            html: html
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return {
                    message: `SendEmail encountered error ${error.message}`,
                    thrownError: error
                };
            }
            else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return {
                message: `SendEmail encountered error ${error.message}`,
                thrownError: error
            };
        }
    }
});
exports.sendEmail = sendEmail;
const getTemplateContent = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = yield fs.promises.readFile(filePath, 'utf8');
        return content;
    }
    catch (error) {
        console.error('Error reading HTML template:', error);
    }
});
const resetPasswordEmail = (email, link) => __awaiter(void 0, void 0, void 0, function* () {
    const templatePath = path.join(__dirname, '..', '..', 'dist', 'resetpassword.html');
    const templateContent = yield getTemplateContent(templatePath);
    if (templateContent) {
        const htmlContent = templateContent
            .replace('{{resetpasswordlink}}', link);
        return htmlContent;
    }
});
exports.resetPasswordEmail = resetPasswordEmail;
