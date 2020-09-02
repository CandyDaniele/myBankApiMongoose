import express from 'express';
import mongoose from 'mongoose';
import {accountRouter} from './routes/accountRouter.js';
import dotenv from 'dotenv';

dotenv.config();
const conect = async () => {
  try{
    await mongoose.connect(
    
      `mongodb+srv://candydaniele:${process.env.PASSWORD}@cluster0.s9tff.mongodb.net/bank?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
  
    console.log('Conectado ao Mongo DB Atlas');
  }catch(err){
    console.log('Erro ao conectar ao MongoDB'+err);
  }
};

conect();

const app = express();

app.use(express.json());
app.use("/account", accountRouter);

app.listen(3000, () => console.log('Api iniciada'));