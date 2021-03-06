const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const User = require('./models/user');

//routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin')
const normalRoutes = require('./routes/Nuser');

//mongoose, sessions, protection, utilities
const MONGODB_URI =
  'mongodb+srv://yif003:Apple007@cluster0.16nk6.mongodb.net/?retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const root = require('./util/root');
const { application } = require('express');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});



//routes control
app.get('/mydb', (req, res, next)=>{
  User.find().exec()
    .then(doc =>{
      res.status(200).json(doc);
    })
    .catch(err=>{
      console.log(err);
      res.status(500).json({error:err})
    })
})      

app.use(normalRoutes);

app.use(adminRoutes);

app.use(authRoutes);


app.get('/', (req,res,next)=>{
  res.sendFile(root+'/views/index.html');
});



mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
