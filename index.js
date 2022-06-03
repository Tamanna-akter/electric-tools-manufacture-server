const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nf8hl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorization'});
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function(error, decoded) {

     if (error) {
       res.status(403).send({ message: "Forbidden Access" });
    }
      req.decoded = decoded;
      next();
  });
};




async function run() {
  try {
      await client.connect();
      const toolsCollection = client.db("electric_tools").collection("tools");
      const orderCollection = client.db("electric_tools").collection("orders");
      const userCollection = client.db("electric_tools").collection("users");
      const reviewCollection = client.db("electric_tools").collection("reviews");
      // create an API for get all login user data
      app.get('/user', verifyJwt, async (req, res) => {
          const users = await userCollection.find().toArray();
          res.send(users);
      });
      // create an API for search admin user 
      app.get('/admin/:email', verifyJwt, async (req, res) => {
          const email = req.params.email;
          const user = await userCollection.findOne({ email: email });
          const isAdmin = user.role === 'admin';
          res.send({ admin: isAdmin })
      });
      // create an API to update make admin login user data 
      app.put('/user/admin/:email', verifyJwt, async (req, res) => {
          const email = req.params.email;
           const requester = req.decoded.email;
           const requesterAccount = await userCollection.findOne({ email: requester });
           if (requesterAccount.role === 'admin') {
              const filter = { email: email };
              const updateDoc = {
                  $set: { role: 'admin' },
              }
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
           } else {
              res.status(403).send({ message: 'Forbidden' })
           }

      });
      // create an API to upsert login user data and sign token
      app.put('/user/:email', async (req, res) => {
          const email = req.params.email;
          const user = req.body;
          const filter = { email: email };
          const options = { upsert: true };
          const updateDoc = {
              $set: user
          };
          const result = await userCollection.updateOne(filter, updateDoc, options);
          const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
          res.send({ result, token });
      });
 

      app.get('/login/:email', verifyJwt, async (req, res) => {
          const email = req.params.email;
          const user = await userCollection.findOne({ email: email });
          res.send(user);
      });
      //  an API to update login user profile  
      app.put('/user/update/:email', verifyJwt, async (req, res) => {
          const email = req.params.email;
          const updateUser = req.body;
          const filter = { email: email };
          const options = { upsert: true };
          const updateDoc = {
              $set: {
                  gender: updateUser.gender,
                  nationality: updateUser.nationality,
                  religion: updateUser.religion,
                  location: updateUser.location,
                  link: updateUser.link,
                  img: updateUser.img
              }
          };
          const result = await userCollection.updateOne(filter, updateDoc, options);
          res.send(result)
      });
     
      app.get('/tools', async (req, res) => {
          const accessories = await toolsCollection.find().toArray();
          res.send(accessories);
      });

      app.get('/tools/:id', async (req, res) => {
          const id = req.params.id;
          const result = await toolsCollection.findOne({ _id: ObjectId(id) });
          res.send(result);
      });
     
      app.post('/tools', verifyJwt, async (req, res) => {
          const tools = req.body;
          const result = await toolsCollection.insertOne(tools);
          res.send(result);
      });
    
      app.put('/tools/:id', async (req, res) => {
          const id = req.params.id;
          const tools = req.body;
          const filter = { _id: ObjectId(id) };
          const options = { upsert: true };
          const updateDoc = {
              $set: {
                  name: tools.name,
                  description: tools.description,
                  minimumOrder: tools.minimumOrder,
                  availableQuantity: tools.availableQuantity,
                  price: tools.price,
                  img: tools.img
              },
          };
          const result = await toolsCollection.updateOne(filter, updateDoc, options);
          res.send(result);
      });
      // create an API to delete tools product
      app.delete('/tools/:id', verifyJwt, async (req, res) => {
          const id = req.params.id;
          const result = await toolsCollection.deleteOne({ _id: ObjectId(id) });
          res.send(result)
      });
      // create an API for get all order data
      app.get('/order', verifyJwt, async (req, res) => {
          const result = await orderCollection.find().toArray();
          res.send(result)
      });
      //  API for get login user order data
      app.get('/order/:email', async (req, res) => {
          const email = req.params.email;
          const result = await orderCollection.find({ email: email }).toArray();
          res.send(result)
      });
      //  an API to insert order
      app.post('/order', async (req, res) => {
          const order = req.body;
          const result = await orderCollection.insertOne(order);
          res.send(result)
      });
      //  an API to delete order
      app.delete('/order/:id', verifyJwt, async (req, res) => {
          const id = req.params.id;
          const result = await orderCollection.deleteOne({ _id: ObjectId(id) });
          res.send(result)
      });
   
      app.get('/review', async (req, res) => {
          const review = await reviewCollection.find().toArray();
          res.send(review)
      });
      
      app.post('/review', verifyJwt, async (req, res) => {
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.send(result)
      });

  } finally {

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