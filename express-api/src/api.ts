import dotenv from "dotenv"
import mongoose from "mongoose"
import cors from "cors"
import session from "express-session"
import MongoStore from "connect-mongo"
import express, { json, Request, Response, NextFunction } from "express"
import routes from "./routes"

dotenv.config()
const { DB_USER = "node-auth", DB_PASS, DB_HOST = "localhost", DB_PORT: DB_PORT_STR, DB_NAME = "node-auth", API_PORT: API_PORT_STR, SESSION_SECRET } = process.env
if (!DB_PASS) throw new Error("DB_PASS environment variable is not defined")
if (!SESSION_SECRET) throw new Error("SESSION_SECRET environment variable is not defined")
const DB_PORT = Number(DB_PORT_STR) || 27017
const API_PORT = Number(API_PORT_STR) || 5000
const DB_URI = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

const clientPromise = mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }).then(async db => {
    db.connection.on("error", console.error)
    console.log("MongoDB database connected")
    return db.connection.getClient()
})

const app = express()
app.use(json())
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"]
}))
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err)
    return res.status(400).send(err.message)
})
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", "application/json")
    next()
})
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        clientPromise: clientPromise
    })
}))
// app.get("/", (_, res) => res.status(200).send("Express api is running"))
app.use("/", routes)
app.listen(Number(API_PORT), () => console.log(`Express server started at http://localhost:${API_PORT}`))
