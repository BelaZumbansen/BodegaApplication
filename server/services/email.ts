import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as handlebars from 'handlebars'
import * as path from 'path'
import { InternalRequestError } from './appError'
import { Hash } from 'crypto'


export const sendEmail = async (email : string, subject : string, payload : Object, template : string) : Promise<void | InternalRequestError> => { 
  try {
      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const source = fs.readFileSync(path.join(__dirname, template), "utf8");
      const compiledTemplate = handlebars.compile(source);
      const options = () => {
        return {
          from: process.env.FROM_EMAIL,
          to: email,
          subject: subject,
          html: compiledTemplate(payload),
        };
      };
      
      transporter.sendMail(options(), (error, info) => {
        if (error) {
          throw error;
        }
      })
  } catch (error) {
    if (error instanceof Error) {
      return {
        message: `SendEmail encountered error ${error.message}`,
        thrownError: error
      };
    }
  }
}
