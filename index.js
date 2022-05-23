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
async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("computerManufacturer").collection
            ("productCollection");
        const orderCollection = client.db("computerManufacturer").collection("orderCollection")
        app.get('/products', async (req, res) => {
            const query = {};
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
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result);
        })
        app.put('/products/update/:id', async (req, res) => {
            const id = req.params.id;
            const product = await productsCollection.findOne({ _id: ObjectId(id) })
            console.log(product);
            const quantity = product.qty - 1
            console.log(quantity);
            const result = await productsCollection.updateOne({ _id: ObjectId(id) }, { $set: { qty: quantity } });
            res.send(result);
        })




        app.put('/api/products/stock/:id', async (req, res) => {
            const id = req.params.id;
            const quantity = req.body.qty.qty;
            console.log(quantity);
            const product = await productsCollection.findOne({ _id: ObjectId(id) });
            console.log(product);
            if (product) {
                if (product.qty == null) {
                    product.qty = 0;
                }
                const qty = parseInt(product.qty) + parseInt(quantity);
                const result = await productsCollection.updateOne({ _id: ObjectId(id) }, { $set: { qty: qty } });
                res.send(result)
            }
        })
        // OrderCollection
        app.post('/orderCollection', async (req, res) => {
            const orders = req.body;
            const result = await orderCollection.insertOne(orders);
            res.send(result)

        })
        app.get('/orderCollection', async (req, res) => {
            const query = req.query;
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })
        app.delete('/orderCollection/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const orders = await orderCollection.deleteOne(query);
            res.send(orders);
        })


    }
    finally {

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
