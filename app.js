const express = require("express");
const app = express();
const userSchemaImport = require("./models/user");
const userPostImport = require("./models/post");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
app.use(cookieParser());

const storage = multer.diskStorage({
  destination:(req,res,cb)=>{
    cb(null,'./public/images/uploads')
  },
  filename:(req,file,cb)=>{
    // const uniqueSuffix =Date.now() + '-' + Math.round(Math.random()*1E9)
    const fn = crypto.randomBytes(12,(err,bytes)=>{
      const fn = bytes.toString("hex") + path.extname(file.originalname);
      // path.extname(file.originalname); eiss line se hmhra file ka extension nikl aayega 
      // console.log(bytes.toString("hex"));
      cb(null,fn);
      console.log(fn);
    })

  }
})

const upload = multer({storage:storage});

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload",upload.single('image'),(req,res)=>{
  console.log(req.body);
  // res.render("profile");
})

app.get("/test",(req,res)=>{
  res.render("test");
})
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

app.post("/post",isLoggedIn,async(req,res)=>{
     let user = await userSchemaImport.findOne({email:req.user.email});
     let {content}= req.body;
     let post = await userPostImport.create({
      user:user._id,
      content:content
     });

     user.posts.push(post._id);
     await user.save();
     res.redirect("/profile");
})

app.get("/profile",isLoggedIn,async(req,res)=>{
 let user = await userSchemaImport.findOne({email:req.user.email}).populate("posts");
 

 console.log("user are",user.email);
  res.render("profile",{user});
})

app.get("/like/:id",isLoggedIn,async(req,res)=>{
  let post = await  userPostImport.findOne({_id:req.params.id}).populate("user");

  if(post.likes.indexOf(req.user.userid) === -1){
    post.likes.push(req.user.userid);
  }else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
  }
  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id",isLoggedIn,async(req,res)=>{
  let post = await userPostImport.findOne({_id:req.params.id}).populate("user");
  res.render("edit" ,{post});
})

app.post("/update/:id",async(req,res)=>{
  let post = await userPostImport.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
  console.log(req.body.content);
  res.redirect("/profile");
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
