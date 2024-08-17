import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as handlebars from 'handlebars'
import * as path from 'path'
import { InternalRequestError } from './appError'
import { Hash } from 'crypto'

const createEmail = (subject: string, payload: Object) : string => {
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
  `
}

export const sendEmail = async (email : string, subject : string, html : string) : Promise<void | InternalRequestError> => { 
  try {
      // create reusable transporter object using the default SMTP transport
      console.log(`Creating Nodemailer Transport using ${process.env.EMAIL_USERNAME} at ${process.env.EMAIL_HOST}`)
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false, // use SSL
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
      }

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
  } catch (error) {
    if (error instanceof Error) {
      return {
        message: `SendEmail encountered error ${error.message}`,
        thrownError: error
      };
    }
  }
}

const getTemplateContent = async (filePath : string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading HTML template:', error);
  }
}

export const resetPasswordEmail = async (email: string, link: string) => {
  const templatePath = path.join(__dirname, '..', '..', 'dist', 'resetpassword.html');
  const templateContent = await getTemplateContent(templatePath);
  if (templateContent) {
    const htmlContent = templateContent
    .replace('{{resetpasswordlink}}', link);
    return htmlContent;
  }
}