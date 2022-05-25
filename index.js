const { MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q9lb9zo.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nf8hl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        await client.connect();
        console.log('connected');
        const toolsCollection = client.db("electric_tools").collection("tools");


        app.get("/tools", async (req, res) => {
            const result = await toolsCollection.find().sort({ _id: -1 }).toArray();
            res.send(result);
          });
    }
    finally{

    }
}
    run().catch(console.dir);

// ******************
app.get("/", (req, res) => {
    res.send("Electric tools manufacturing running!");
  });
  app.listen(port, () => {
    console.log("electric tools listening on", port);
  });