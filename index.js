const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const { json } = require('express/lib/response');
const { MongoClient, ServerApiVersion } = require('mongodb');
const res = require('express/lib/response');
// User:
// PASS:

require("dotenv").config();
const port = process.env.PORT || 5000
const app = express();
// app.use(cors());
const corsConfig = {
    origin: true,
    credentials: true,
}
app.use(cors(corsConfig))
app.options('*', cors(corsConfig))


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ib4x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        await client.connect();
        const productsCollection =client.db("computerManufacturer").collection("productCollection");
        app.get('/products', async(req, res)=>{
            const query ={};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
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
