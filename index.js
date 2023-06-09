const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const main = require("./main");
const half = require("./half");
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ki0ifk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// jwt token verify
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;
  const splitToken = token.split(" ")[1];
  if (!token) {
    return res
      .status(403)
      .json({ error: true, message: "unauthorized access" });
  }
  jwt.verify(splitToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: true, message: "unauthorized" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // datebase list
    const summerTeam = client.db("summerCamp").collection("TeamDB");
    const instructorDB = client.db("summerCamp").collection("instructorDB");
    const coursesDB = client.db("summerCamp").collection("coursesDB");
    const orderDB = client.db("summerCamp").collection("orderDB");

    // JWT token sign
    app.post("/jwt", (req, res) => {
      const { email } = req.body;
      const token = jwt.sign({ email }, process.env.JWT_SECRET);
      res.json({ token });
    });

    // about us team members
    app.get("/team", async (req, res) => {
      const cursor = summerTeam.find({});
      const team = await cursor.toArray();
      res.send(team);
    });
    // instructor list for courses
    app.get("/instuctor", async (req, res) => {
      const query = req.query.name;
      const cursor = await instructorDB.find({ name: query }).toArray();
      const courses = await coursesDB
        .find({
          teacherName: query,
        })
        .toArray();
      res.send({ cursor, courses });
    });
    // courses data send
    app.get("/courses", async (req, res) => {
      const { sort } = req.query;
      if (sort === "true") {
        const cursor = await coursesDB.find({}).sort({ price: 1 }).toArray();
        return res.send(cursor);
      }
      const cursor = await coursesDB.find({}).toArray();
      res.send(cursor);
    });
    // order data post
    app.post("/order", async (req, res) => {
      const query = req.body;
      const cursor = await orderDB.insertOne(query);
      res.send(cursor);
    });
    // order data send
    app.get("/orders", verifyJWT, async (req, res) => {
      const { email } = req.query;
      const cursor = await orderDB.find({ email: email }).toArray();
      res.send(cursor);
    });
    // order delete
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const cursor = await orderDB.deleteOne({ _id: new ObjectId(id) });
      res.send(cursor);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/half", (req, res) => {
  res.send(half);
});
app.get("/main", (req, res) => {
  res.send(main);
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
