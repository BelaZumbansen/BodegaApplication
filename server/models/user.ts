import { model, Schema, Model, Document, ObjectId } from 'mongoose'

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  firstName: string;
  lastName: string;
  biography: string;
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
export const UserModel : Model<IUser> = model<IUser>('User', UserSchema);

export class User {

  userId: string;
  email: string;
  hashPass: string;
  displayName: string;
  firstName: string;
  lastName: string;
  biography: string;

  constructor(userDoc : IUser & { _id: ObjectId}) {
    this.userId = userDoc._id;
    this.email = userDoc.email;
    this.hashPass = userDoc.password;
    this.displayName = userDoc.displayName;
    this.firstName = userDoc.firstName;
    this.lastName = userDoc.lastName;
    this.biography = userDoc.biography;
  }
}