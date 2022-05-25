const express = require ('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



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

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "UnAuthirized access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ messade: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();


    });

}

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db("computerManufacturer").collection
            ("productCollection");
        const orderCollection = client.db("computerManufacturer").collection("orderCollection")
        const userCollection = client.db("computerManufacturer").collection("user")
        const reviewCollection = client.db("computerManufacturer").collection("review")
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
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })
        app.put('/products/update/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const product = await productsCollection.findOne({ _id: ObjectId(id) })
            console.log(product);
            const quantity = product.qty - 1
            console.log(quantity);
            const result = await productsCollection.updateOne({ _id: ObjectId(id) }, { $set: { qty: quantity } });
            res.send(result);
        })

        // app.post('/create-payment-intent', async(req, res)=>{
        //     const service = req.body;
        //     const price = service.price;
        //     const amount =price*100;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency :'usd',
        //         payment_method_types:['card']

        //     })
        //     res.send({clientSecret:paymentIntent.client_secret})
        // })

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
        app.get('/orderCollection', async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        app.post('/orderCollection', async (req, res) => {
            const orders = req.body;
            const result = await orderCollection.insertOne(orders);
            res.send(result)

        })
        // verifyJWT,
        app.get('/orderCollection', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log("auth Header", authorization);
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' })
            }

        })
        app.get('/orderCollection/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        })
        app.delete('/orderCollection/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const orders = await orderCollection.deleteOne(query);
            res.send(orders);
        })

        // User Collection
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })
        app.post('/user', async (req, res) => {
            const orders = req.body;
            const result = await userCollection.insertOne(orders);
            res.send(result)

        })

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {

                $set: { role: "admin" }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user?.role === "admin";

            res.send({ admin: isAdmin });
        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const option = { upsert: true };
            const updateDoc = {

                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ result, token })
        })

        // ReviewCollection...
        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // read task by single 
        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.findOne(query);
            res.send(result);
        });

        // get add task data by post
        app.post('/review', async (req, res) => {
            const newTask = req.body;
            const result = await reviewCollection.insertOne(newTask);
            res.send(result);
        });


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
