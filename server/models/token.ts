import { model, Schema, Model, Document, ObjectId } from 'mongoose'

export interface IToken extends Document {
  userId: ObjectId,
  token: string,
  createdAt: Date
}

const TokenSchema : Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user"
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

export const TokenModel : Model<IToken> = model<IToken>('Token', TokenSchema);

