const mongoose = require('mongoose')

const connectionString = process.env.CONNECTION_STRING;

mongoose
    .connect(connectionString, { connectTimeoutMS: 5000})
    .then(() => console.log("Database Connected"))
    .catch(error => console.log(error))
