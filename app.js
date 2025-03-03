<<<<<<< HEAD
require('dotenv').config();
=======
require("dotenv").config();

require("./models/connection");

>>>>>>> 078bd738a4a477a0f69e8305fcb041dcb93819e0
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("./models/connection");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const cors = require("cors");
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
