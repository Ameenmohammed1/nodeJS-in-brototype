var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars");/*layout adding section set cheyan vilichatanu*/
var fileUpload= require('express-fileupload')//add product vazi image polathe file upload cheyumbol athum kudi edukkan ee module install cheyanam 
var session=require('express-session')//jwt pole work avunnu user login cheythu pinne varumbol auto metic login avunnu

var db=require('./config/connection')//config enna folder vilichu
var app = express();

//routers
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
/*layout adding section*/
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout", //default layoutinte peru entu default layout set cheythu
    layoutsDir: __dirname + "/views/layout/", //layout directory path paranju layout folder vilichu
    partialsDir: __dirname + "/views/partials", //partial directory path paranju partials folder vilichu
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload())//file upload module vilichu kodukanam
app.use(session({secret: 'keyboard cat',cookie: {maxAge:600000}}))//sesssion active akki oru secret key koduthu ithu enthu venamengilum kodukkam etra time vare auto metic login work avanam secondil anu value kodukkan ullathu

db.connect((err)=>{//active database
  if(err){
    console.log(err);
  }else{
    console.log('connectod port 3000');
  }
})//db nte akathull connect enna function vilichu


app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
