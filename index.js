const express = require('express')
const app = express()
const cors = require('cors');
const port = 5000;
require('dotenv').config();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.get('/', (req, res) => {
  res.send('Hireloop server is running')
})

const uri = process.env.MONGODB_URI;

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

    const database = client.db("hireloop");
    const jobsCollection = database.collection("jobs");
    const companiesCollection = database.collection("companies");
    const applicationsCollection = database.collection("applications");

    app.get('/api/jobs', async (req, res) => {
      const query = {};
      if(req.query.companyId){
        query.companyId = req.query.companyId;
      }
      if(req.query.status){
        query.status = req.query.status;
      }
      const cursor = jobsCollection.find(query);
      const jobs = await cursor.toArray();
      res.send(jobs);
    });
    app.get('/api/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);
      res.send(job);
    })
    app.post('/api/jobs', async (req, res) => {
      try {
        const job = req.body;
        const newJob = {
          ...job,
          timestamp: new Date()
        }
        const result = await jobsCollection.insertOne(newJob);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create job' });
      }
    });
    //companies
    app.get('/api/my/companies', async (req, res) => {
      try {
        const query = {};

        if (req.query.recruiterId) {
          query.recruiterId = req.query.recruiterId;
        }

        const result = await companiesCollection.findOne(query);

        res.send(result || {});
      } catch (error) {
        res.status(500).send({ message: 'Server error', error });
      }
    });
    
    app.post('/api/companies', async (req, res) => {
      try {
        const company = req.body;
        const newCompany = {
          ...company,
          timestamp: new Date()
        }
        const result = await companiesCollection.insertOne(company);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create company' });
      }
    });
    //applicaions
    app.post('/api/applications', async (req, res) => {
      try {
        const application = req.body;
        const newApplication = {
          ...application,
          timestamp: new Date()
        }
        const result = await applicationsCollection.insertOne(newApplication);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create application' });
      }
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})