const express = require('express');
const app = express();
const cookies = require('cookie-parser');

// using environment variables to store the secret
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config({path: "config/config.env"});
}

// Using middleware to parse the body of the request
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Using middleware to parse the cookies
app.use(cookies());

// Importing the routes
const post = require('./routes/post');
const user = require('./routes/user');

// Use the routes
app.use('/api/v1', post);
app.use('/api/v1', user);


module.exports = app;