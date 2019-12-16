#!/usr/bin/env node

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
const engine = require('ejs-locals');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb+srv://yc9841:chen2yu3tao1@yc001-0ofxw.azure.mongodb.net/test?retryWrites=true&w=majority');

const db = mongoose.connection;
db.on('error', console.log.bind(console, "connection error")); 
db.once('open', function() {
    console.log("connection succeeded");
});

const app = express();

app.use(express.static(__dirname));  
app.use(bodyParser.json()); 
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'coursework is hell',
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));

app.engine('ejs', engine);
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');

app.post('/login', function(req, res) {

	let email = req.body.email_login;
	let password = req.body.password_login;

	db.collection('Test').find({email: email}).toArray(function (err, result) {
		if (err) throw err;
		if (result.length === 0) {
			console.log("Account doesn't exists!");
			res.render('login_failed', {title: 'Login failed', error_message: "Account doesn't exists!"});
		} else {
			if (result[0].password !== password) {
				console.log("Password incorrect!");
				res.render('login_failed', {title: 'Login failed', error_message: "Password incorrect!"});
			} else {
				req.session.userID = email;
				console.log("Login successful!");
				console.log("userID: " + req.session.userID);
				res.render('start_friendship', {title: 'GlobalPal', user_name: result[0].firstname});
			}
		}
	});
});

app.get('/login_page', function(req, res) {
	res.render('login_page', {title: 'Login'});
});

app.post('/signup', function(req, res) {

	let firstname = req.body.firstname_signup;
	let lastname = req.body.lastname_signup;
	let email = req.body.email_signup;
	let password = req.body.password_signup;
	let phone = req.body.phone_signup;

	db.collection('Test').find({$or: [{email: email}, {phone: phone}]}).toArray(function (err, result) {
		if (result.length === 0) {
			let new_account = {
				firstname: firstname,
				lastname: lastname,
				email: email,
				password: password,
				phone: phone,
				//bellow are reserved as placeholder
				profile: {data: fs.readFileSync('images/default_profile.png'), contentType: 'image/png'},
				gender: "secret",
				age: "secret",
				birthday: "secret",
				country: "secret",
				city: "secret",
				job: "secret",
				sexualorientation: "secret",
				personaldescription: "secret",
				facebooklink: "secret",
			};
			db.collection('Test').insertOne(new_account, function(err) {
				if (err) throw err;
				console.log("Account registered Successfully!");
			});
			res.render('signup_successful', {title: 'Sign up successful!'});
		} else {
			console.log("Account exists!");
			res.render('signup_failed', {title: 'Sign up failed!'});
		}
	});
});

app.get('/signup_page', function(req, res) {
	res.render('signup_page', {title: 'Sign up'});
});

const port = 3000;
app.get('/', function(req, res) {
	res.set({ 
		'Access-Control-Allow-Origin': '*'
	});
	res.render('welcome_page', {title: 'Welcome to GlobalPal!'});
}).listen(port, function() {
	console.log("server listening at port " + port);
});
