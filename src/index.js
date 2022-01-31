import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();

const app = express();
app.use(cors());
app.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("batepapouol");
});

app.post("/participants", async (req, res) => {
    try {
      const uol = mongoClient.db("batepapouol");
      const participants = uol.collection("participants");
      const messages = uol.collection("messages");
  
      const online = await participants.find({}).toArray();
  
      let participantsList = online.map((el) => el.name);
  
      const username = req.body;
      const userSchema = joi.object().keys({
        name: joi
          .string()
          .invalid(...participantsList)
          .required(),
      });
  
      const validation = userSchema.validate(username, { abortEarly: true });
  
      if (validation.error) {
        if (validation.error.details[0].type === "any.invalid") {
          res.status(409).send("Usuário já existente");
        } else {
          res.status(422).send("Insira um nome válido");
        }
        return;
      }
  
      username.lastStatus = Date.now();
      await participants.insertOne(username);
  
      let StatusMsg = {
        from: username.name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs(username.lastStatus).format("HH:mm:ss"),
      };
      await messages.insertOne(StatusMsg);
  
      res.sendStatus(201);
    } catch {
      res.sendStatus(500);
    }
});

app.get("/participants", async (req, res) => {
    try {
      const uol = mongoClient.db("batepapouol");
      const participants = uol.collection("participants");
      let online = [];
      online = await participants.find({}).toArray();
      res.send(online);
    } catch {
      res.sendStatus(500);
    }
});
  
app.listen(5000, () => {
    console.log("Rodando API Bate Papo Uol em http://localhost:5000");
});