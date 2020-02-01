// /Users/JD/mongodb/bin/mongod.exe --dbpath=/Users/JD/mongodb-data 

const express = require("express")
require("./db/mongoose")
const cors = require("cors")
const userRouter = require("./routes/userRouter.js")
const logRouter = require("./routes/logRouter.js")


const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(cors())
app.use(logRouter)
app.use(userRouter)


app.listen(port, () => {
    console.log("Server up on: " + port)
})