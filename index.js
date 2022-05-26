const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sfi7oe7.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const partCollection = client.db('red_parts').collection('parts');
        const byeCollection = client.db('red_parts').collection('bye');
        const userCollection = client.db('red_parts').collection('users');




        app.get('/part', async (req, res) => {
            const query = {};
            const cursor = partCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        })




        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })












        app.get('/bye', async (req, res) => {
            const customer = req.query.customer;
            const query = { customer: customer };
            const bye = await byeCollection.find(query).toArray();
            res.send(bye);
        })




        app.post('/bye', async (req, res) => {
            const bye = req.body;
            const result = await byeCollection.insertOne(bye);
            res.send(result);
        })


    }
    finally {

    }

}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello From Red Parts')
})

app.listen(port, () => {
    console.log(`Car Parts listening on port ${port}`)
})