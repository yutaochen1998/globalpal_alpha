var express=require("express"); 
var bodyParser=require("body-parser"); 
var mongoose = require('mongoose');
var fs = require('fs');
var session = require('express-session');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb+srv://yc9841:chen2yu3tao1@yc001-0ofxw.azure.mongodb.net/test?retryWrites=true&w=majority');

var db=mongoose.connection; 
db.on('error', console.log.bind(console, "connection error")); 
db.once('open', function() {
    console.log("connection succeeded");
});
  
var app=express();
  
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

app.set('view engine', 'ejs');

app.post('/login', function(req, res) {

    var email = req.body.email_login; 
    var password = req.body.password_login; 

	db.collection('Test').find({email: email}).toArray(function(err, result) {
		if (err) throw err;
		if (result.length === 0) {
			console.log("Account doesn't exists!");
			//res.redirect('/html/login_failed.html');
			res.render('login_failed', {error_message: "Account doesn't exists!"});
		} else {
			if (result[0].password !== password) {
				console.log("Password incorrect!");
				//res.redirect('/html/login_failed.html');
				res.render('login_failed', {error_message: "Password incorrect!"});
			} else {
				req.session.userID = email;
				console.log("Login successful!");
				console.log("userID: " + req.session.userID);
				//res.redirect('/html/start_friendship.html');
				res.render('start_friendship', {name: result[0].firstname});
				//res.sendFile('/html/start_friendship.html', {root: __dirname })
				//res.json({userID: req.session.userID});
				//res.end();
			}
		}
	});
});

app.get('/login_page', function(req, res) {
	//res.redirect('/html/login_page.html');
	res.render('login_page');
});

app.post('/signup', function(req, res) {
	
    var firstname = req.body.firstname_signup;
	var lastname = req.body.lastname_signup;
    var email = req.body.email_signup; 
    var password = req.body.password_signup; 
    var phone = req.body.phone_signup; 
	
	db.collection('Test').find({$or: [{email: email}, {phone: phone}]}).toArray(function(err, result) {
		if (err) throw err;
		if (result.length === 0) {
			var new_account = { 
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
				console.log("Account inserted Successfully!"); 
			}); 
			//res.redirect('/html/signup_successful.html');
			res.render('signup_successful');
		} else {
			console.log("Account exists!");
			//res.redirect('/html/signup_failed.html');
			res.render('signup_failed');
		}
	});
});

app.get('/signup_page', function(req, res) {
	//res.redirect('/html/signup_page.html');
	res.render('signup_page');
});

var port = 3000;
app.get('/', function(req, res) {
	res.set({ 
		'Access-Control-Allow-Origin': '*'
	});
	//res.redirect('/html/welcome_page.html');
	res.render('welcome_page', {name: 'Yutao'});
}).listen(port, function() {
	console.log("server listening at port " + port);
});
