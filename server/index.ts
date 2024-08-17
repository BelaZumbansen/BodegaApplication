import app from './config/app';
import express, {Express, Request, Response} from 'express'
import * as dotenv from 'dotenv'
import { authRoute } from './routes/authRouter'
import mongoose from 'mongoose';

// Set Up
dotenv.config();

const PORT = process.env.PORT || 3001;

export const routes = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/', routes);
routes.use(authRoute);

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI ?? '')
  .then(() => {
    console.log(`Successfully connected to MongoDB ${process.env.MONDOGB_URI}`);

    app.listen(PORT, () => {
      console.log(`[server]: Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log('MongoDB connection error:', error);
    process.exit(1);
  });
