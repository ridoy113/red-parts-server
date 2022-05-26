const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sfi7oe7.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}





async function run() {
    try {
        await client.connect();
        const partCollection = client.db('red_parts').collection('parts');
        const byeCollection = client.db('red_parts').collection('bye');
        const userCollection = client.db('red_parts').collection('users');
        const ratingCollection = client.db('red_parts').collection('ratings');




        app.get('/part', async (req, res) => {
            const query = {};
            const cursor = partCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts);
        })



        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })




        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })




        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });

            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send({ result });
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }

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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        })







        app.get('/bye', verifyJWT, async (req, res) => {
            const customer = req.query.customer;
            const decodedEmail = req.decoded.email;

            if (customer === decodedEmail) {
                const query = { customer: customer };
                const bye = await byeCollection.find(query).toArray();
                return res.send(bye);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }

        })




        app.post('/bye', async (req, res) => {
            const bye = req.body;
            const result = await byeCollection.insertOne(bye);
            res.send(result);
        })



        app.get('/rating', verifyJWT, async (req, res) => {
            const ratings = await ratingCollection.find().toArray();
            res.send(ratings);
        })




        app.post('/rating', verifyJWT, async (req, res) => {
            const rating = req.body;
            const result = await ratingCollection.insertOne(rating);
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