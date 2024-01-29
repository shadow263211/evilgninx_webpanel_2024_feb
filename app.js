if(process.env.NODE_ENV !=='production'){
  require('dotenv').config()
}

const express = require('express')
const app = express()
const path = require('path');
var fs = require('fs');
const users = require('./users')
const passport= require('passport')
const bcrypt= require('bcrypt')
const flash= require('express-flash')
const session = require('express-session')
const axios = require("axios").default;

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + "/public/"));
app.set('view-engine', 'ejs');
const logger = require('morgan');
app.use(logger('dev'));
//////////////////
app.use(express.urlencoded({
  extended: false
}));

const initializePassport = require('./passport-config')

initializePassport(
  passport,
  name=>users.find(user=> user.name===name),
  id=>users.find(user=> user.id===id)
)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())



//////////////////
app.get('/', checkAuthenticated,async (req, res) => {
  //console.log(data.length)
  await fs.readFile('data.db', 'UTF-8', (err, file) => {
    if (err) {
      console.log(err);
    } else {
      file = file.split("\n");
      var data = []
      for (var i = 0; i < file.length; i++) {
        if (file[i].includes("{") || file[i].includes('"custom":{')) {
          data.push(JSON.parse(file[i]));
        }
      }

      res.render('index.ejs', {
        data: data
      });
    }
  });
});

app.get('/login',checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login',checkNotAuthenticated,passport.authenticate('local',{
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.post("/verify", async function (req, res, next) {
  // console.log(req.body[ "g-recaptcha-response" ])
  console.log(req.body);
  console.log(process.env.RECAPTCHA_SECRET)
  try {
    const data = await axios.post("https://www.google.com/recaptcha/api/siteverify",
      {
        secret: "6Lc3Gl8pAAAAAGlt0QTkf03Y1ej5u6a1aNjLL--S",
        response: req.body[ "g-recaptcha-response" ]
      })
    console.log(data.data, "----", data.status, "----", data.statusText)
  } catch(error) {
    console.log("error: ", error);
  }
})

function checkAuthenticated(req,res,next){
  if(req.isAuthenticated())
  {
    return next()
  }
  res.redirect('/login')
}

function checkNotAuthenticated(req,res,next){
  if(req.isAuthenticated())
  {
    return res.redirect('/')
  }
  next()
}
console.log("Server Running on Port 4000...")
app.listen(4000)


