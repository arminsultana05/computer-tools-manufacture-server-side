const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const { json } = require('express/lib/response');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
// User:
// PASS:

require("dotenv").config();
const port = process.env.PORT || 5000
const app = express();
app.use(cors());
const corsConfig = {
    origin: true,
    credentials: true,
}
app.use(cors(corsConfig))
app.options('*', cors(corsConfig))
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ib4x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        await client.connect();
        const productsCollection =client.db("computerManufacturer").collection
        ("productCollection");
        const orderCollection = client.db("computerManufacturer").collection("orderCollection")
        app.get('/products', async(req, res)=>{
            const query ={};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        })
        // app.post('/products', async (req, res) => {
        //     const newProduct = req.body;
        //     const result = await productsCollection.insertOne(newProduct);
        //     res.send(result);
        // })
        app.post('/orderCollection', async (req, res) => {
            const orders = req.body;
            const result = await orderCollection.insertOne(orders);
            res.send(result)

        })
       

    }
    finally{

    }
}
run().catch(console.dir)


// middleware
app.get('/', (req, res) => {
    res.send("Running Product server")
})


app.listen(port, () => {
    console.log("Listinig to port", port)
})
