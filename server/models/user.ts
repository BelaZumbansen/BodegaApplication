import { model, Schema, Model, Document } from 'mongoose'

export interface IUser extends Document {
  email: string;
  password: string;
}

// Define User Schema
const UserSchema : Schema = new Schema({
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
export const UserModel : Model<IUser> = model<IUser>('User', UserSchema);

export class User {

  email: string;
  hashPass: string

  constructor(userDoc : IUser) {

    this.email = userDoc.email;
    this.hashPass = userDoc.password;
  }
}