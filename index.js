const express = require('express');
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware 
app.use(cors({
  origin:['http://localhost:5173']
}))
app.use(express.json())

//MongoDB Connect

 
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.vuprbzv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    const reviewCollection = client.db("MicroMintDB").collection("reviews")
    const userCollection = client.db("MicroMintDB").collection("users")
    const taskCollection = client.db("MicroMintDB").collection("tasks")

    //JWT RELATED API
    app.post('/jwt', async(req,res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'24h'})
      res.send({token})
    })
    //middlewares
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
    //verifyAdmin
    const verifyAdmin = async(req,res,next) => {
      const email = req.decoded.email;
      const query = {email : email}
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({message: "forbiden access"})
      }
      next()
    }
    // verifyClient
    const verifyClient = async(req,res,next) => {
      const email = req.decoded.email;
      const query = {email : email}
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'client';
      if (!isAdmin) {
        return res.status(403).send({message: "forbiden access"})
      }
      next()
    }
    //verifyFreelancer
    const verifyFreelancer = async(req,res,next) => {
      const email = req.decoded.email;
      const query = {email : email}
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === 'freelancer';
      if (!isAdmin) {
        return res.status(403).send({message: "forbiden access"})
      }
      next()
    }
    //users api start
    // user post api
    app.post('/users',async(req,res) =>{
      const user = req.body;
      const query = {email:user.email}
      const exitingUser = await userCollection.findOne(query)
      if(exitingUser){
        return res.send({message:'user already exists',insertedId:null})
      }
      const result = await userCollection.insertOne(user)
    })
    // usser get api
    app.get('/user/admin/:email',verifyToken, async(req,res) =>{
      const email = req.params.email;
      if (email !== req.decoded.email ) {
        return res.status(403).send({message: 'forbiden  access'})
      }
      const query = { email: email };
    const user = await userCollection.findOne(query);
       
      res.send(user)
    })
    app.patch('/user/:email',async(req,res) =>{
      const email = req.params.email;
      const info = req.body.currentCoin;
      console.log(info,email);
      const filter = {email : email}
      const updatedInfo ={
        $set:{
          coins:info
        }
      }
      const result = await userCollection.updateOne(filter,updatedInfo)
      res.send(result)
    })
    // app.get('/user/admin/:email', async(req,res) =>{
    //   const email = req.params.email;
    //   const query = {email : email}
    //   const user = await userCollection.findOne(query)
    //   console.log(user);
    //   res.send(user)

    // })
    //user api end
    //task api start
    app.post('/task',async(req,res) =>{
      const task = req.body;
      const result = await taskCollection.insertOne(task)
      res.send(result)
    })
    app.get('/task',async(req,res) =>{
      const result = await (await taskCollection.find().toArray()).reverse()
      res.send(result)
    })
    app.patch('/task/:id',async(req,res) =>{
      const id = req.params.id;
      const info = req.body;
      const query = {_id: new ObjectId(id)}
      const updatedInfo ={
        $set:{
          task_title:info.task_title,
          task_detail:info.task_detail,
          task_quantity:info.task_quantity,
          per_task_pay:info.per_task_pay,
          payable_amount:info.payable_amount,
          completion_date:info.completion_date,
          submission_info:info.submission_info,
        }
      }
      const result = await taskCollection.updateOne(query,updatedInfo)
      res.send(result)
      
    })
    app.delete('/task/:id',async(req,res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await taskCollection.deleteOne(query)
      res.send(result)
    })
    app.get('/task/:id',async(req,res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await taskCollection.findOne(query)
      res.send(result)
    })
    //task api end
    // Get Review api
    app.get('/reviews', async(req,res) => {
      const result = await reviewCollection.find().toArray()
      res.send(result)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


//test working server
app.listen(port,() => {
    console.log(`MicroMint is running port on ${port}`);
})
app.get('/',(req,res) =>{
    res.send("MicroMint is working")
})
