const express = require("express");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.qwpevua.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("utility_db");
    console.log("✅ MongoDB Connected Successfully");
    const allBillCollection = db.collection("all-bills");
    const billCollection = db.collection("bills");
    const paymentsCollection = db.collection("payments");
    const totalBillsCollection = db.collection("total-bills");

    // 🏠 Root route
    app.get("/", (req, res) => {
      res.send("⚡ Utility Bill Management API is running...");
    });

    // 📄 Recent 6 bills
    app.get("/all-bills", async (req, res) => {
      try {
        const result = await allBillCollection
          .find()
          .sort({ date: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 🔍 Single bill
    app.get("/all-bills/:id", async (req, res) => {
      try {
        const bill = await allBillCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (!bill) return res.status(404).send({ message: "Bill not found" });
        res.send(bill);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 📄 **Total bills (with optional category filter)**
    app.get("/total-bills", async (req, res) => {
      try {
        const { category } = req.query;
        const query = category ? { category } : {};
        const result = await totalBillsCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 🔍 Get total bill by ID
    app.get("/total-bills/:id", async (req, res) => {
      try {
        const bill = await totalBillsCollection.findOne({
          _id: new ObjectId(req.params.id),
        });
        if (!bill) return res.status(404).send({ message: "Bill not found" });
        res.send(bill);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 📄 All bills from 'bills' collection
    app.get("/bills", async (req, res) => {
      try {
        const result = await billCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 💳 Add payment
    app.post("/payments", async (req, res) => {
      try {
        const paymentData = req.body;
        await paymentsCollection.insertOne(paymentData);
        res.send({ message: "Payment successful" });
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 🧾 Get payments for a specific user by email
    app.get("/payments", async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) return res.status(400).send({ error: "Email is required" });

        const payments = await paymentsCollection
          .find({ email })
          .sort({ date: -1 })
          .toArray();

        res.send(payments);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 🛠️ Update payment by ID (NEW)
    app.put("/payments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await paymentsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "No payment found to update" });
        }

        res.send({ message: "Payment updated successfully" });
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // ❌ Delete payment by ID (NEW)
    app.delete("/payments/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await paymentsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ message: "No payment found to delete" });
        }

        res.send({ message: "Payment deleted successfully" });
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
