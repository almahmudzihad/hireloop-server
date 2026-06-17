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

const logger = (req, res, next) => {
  console.log(req.method, req.path, 'Time:', Date.now());
  next();
}
const verifyToken = (req, res, next) => {
  console.log(req.headers, "headers");
  next();
}
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
    const planCollection = database.collection("plans");
    const subscriptionsCollection = database.collection("subscriptions");
    const usersCollection = database.collection("user");

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
    app.get('/api/companies', async (req, res) => {
            const cursor = companiesCollection.find();
            const companies = await cursor.toArray();

            res.send(companies);
          });
    //  app.get('/api/companies', async (req, res) => {
    //         const cursor = companyCollection.find();
    //         const companies = await cursor.toArray();

    //         for (const company of companies) {
    //             const filter = {
    //                 companyId: company._id.toString()
    //             }
    //             const jobCount = await jobCollection.countDocuments(filter)
    //             company.jobCount = jobCount
    //         }

    //         res.send(companies);
    //     })
      
    app.patch('/api/companies/:id', logger, verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const updatedCompany = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: updatedCompany.status
          }
        };
        const result = await companiesCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to update company' });
      }
    });

    //applicaions
    app.get('/api/applications', async (req, res) => {
      const query = {};
      if(req.query.applicantId){
        query.applicantId = req.query.applicantId;
      }
      if(req.query.jobId){
        query.jobId = req.query.jobId;
      }
      const cursor = applicationsCollection.find(query);
      const applications = await cursor.toArray();
      res.send(applications);
    })
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

    //plans
    app.get('/api/plans', async (req, res) => {
      const query = {};
      if(req.query.plan_id){
        query.id = req.query.plan_id;
      }
      const plan = await planCollection.findOne(query);
      res.send(plan);
    })
    app.post('/api/plans', async (req, res) => {
      try {
        const plan = req.body;
        const newPlan = {
          ...plan,
          timestamp: new Date()
        }
        const result = await planCollection.insertOne(newPlan);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create plan' });
      }
    });
    //subcriptions
    app.post('/api/subscriptions', async (req, res) => {
      try {
        const subscription = req.body;
        const newSubscription = {
          ...subscription,
          createdAt: new Date()
        }
        const result = await subscriptionsCollection.insertOne(newSubscription);
        //update user plan
        const filter = {email : subscription.email};
        const updateDoc = {
          $set: { plan: subscription.planId}
        }
        const updateResult = await usersCollection.updateOne(filter, updateDoc);
        res.send(updateResult);
      } catch (error) {
        res.status(500).send({ error: 'Failed to create subscription' });
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