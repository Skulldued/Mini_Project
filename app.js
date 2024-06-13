const express = require("express");
const app = express();
const userSchemaImport = require("./models/user");
const userPostImport = require("./models/post");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});




app.post("/register", async (req, res) => {
  let { username, name, email, age, password } = req.body;
  let user = await userSchemaImport.findOne({ email });
  if (user) return res.status(400).send("user already Register");
  bcrypt.genSalt(10, (err, salt) => {
    // console.log(salt);
    // bcrypt.hash(req.body.password,salt,(err,hash)=>{
    //   console.log(hash);
    bcrypt.hash(password, salt, async (err, hash) => {
     let user= await userSchemaImport.create({
      username,
        name,
        age,
        email,
        password:hash
      });
      let token = jwt.sign({email:email,userid:user._id},"sunny");
      res.cookie("token",token);
      res.render("login");

    });
  });
});

app.get("/login",(req,res)=>{
  res.render("login");
});

app.get("/profile",isLoggedIn,(req,res)=>{
  console.log(req.user);
  res.render("profile");
})

app.post("/login",async(req,res)=>{
  let {email,password}=req.body;
  const user =await userSchemaImport.findOne({email});
  if(!user){
    return res.status(400).send("User Not Found");
  }

  bcrypt.compare(password,user.password,(err,result)=>{
    if(result){
      let token = jwt.sign({email:email,userid:user._id},"sunny");
      res.cookie("token",token);
      res.status(200).send("you can login");
      
    }else{
       res.status(400).redirect("/");
      
    }
  })

});

app.get("/logout",(req,res)=>{
  res.cookie("token","");
  res.redirect("/login");
});

//middleware

function isLoggedIn(req,res,next){
  if(req.cookies.token === "") res.send("you must be logged in");
  else{
    let data =jwt.verify(req.cookies.token,"sunny");
    req.user = data;

  }
  next();

}


app.listen(3000, () => {
  console.log("server started");
});
