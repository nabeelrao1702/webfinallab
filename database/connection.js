const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const database = "mongodb://localhost:27017";

const connectWithRetry = () => {
    mongoose
        .connect(database, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Connection was very very Successful ;)");
        })
        .catch((err) => {
            console.log("Connection error:", err.message);
            console.log("Reconecting...");
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();