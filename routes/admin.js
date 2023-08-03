var express = require("express");
//const productHelpers = require("../helpers/product-helpers");
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
var userHelpers = require("../helpers/user-helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    //user alredy login anengil true anu engil login vilikumbil '/' lottu redirerct cheyum

    next();
  } else {
    res.redirect("/admin/ad-log");
  }
};

/* GET users listing. */
router.get("/", verifyLogin, function (req, res, next) {
  productHelper.getAllProduct().then((product) => {
    //console.log(product);
    res.render("admin-page/view-product", { product }); //admin folderil ninnum view-product vilichu
  });
});

//creat route in add-product in admin page

router.get("/add-product", (req, res) => {
  res.render("admin-page/add-product");
});

//add-productil ninnum data edukan ulla router creat cheythu post method
router.post("/add-product", (req, res) => {
  // console.log(req.body);//user post cheytha data edutthu
  // console.log(req.files.Image);//image file edutthu

  productHelper.addproduct(req.body, (id) => {
    //req.body add-product vazi post cheytha data pass cheythu id:data save cheytha id return cheythu

    let image = req.files.Image; //user ayacha image eduthu

    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      //admin tharunna image public folderle product imagel id +jpg formatil save cheyanam
      if (!err) {
        //image create cheyumbol err onnum illengil add-product pagilottu povuka
        res.render("admin-page/add-product"); //image product-image folderil save ayal veendum add-product pagil varum
      } else {
        // console.log(err);
      }
    });
  });
}); //product helper enna folderle addProduct enna functionilottu req.body pass cheythu

/**********DElete Product****** */

//first id pass method sample method
/*

router.get('/delete-product/:id',(req,res)=>{
    let productId=req.params.id;//ivide user delet click cheyumbol kude oru id pass cheyunnu athedukkan anu ithu upayogikunathu req.body post methodil data edukkan req.params get method vazi pass cheyunna data edukkan mukalil /:id koduthu id enna peranu params. shesham vilikendathu id
})
*/

//second id pass method real method
router.get("/delete-product/", (req, res) => {
  let productID = req.query.id; //ee rithiyanu user /?id=id pass cheyumbol id edukkan ulla rithi

  //console.log(productID);

  productHelper.deletProduct(productID).then(() => {
    res.redirect("/admin");
  });
});

/*******Edit Product******* */
router.get("/edit-product/", async (req, res) => {
  let product = await productHelper.getEditProductDetails(req.query.id); //user edit buttenil click cheythappol id pass cheyukayum aa id vechulla data eduthu kondu varukayum cheythu
  //console.log(product);//user edit buttenil click cheythappol id pass cheyukayum aa id vechulla data eduthu kondu varukayum cheythu
  res.render("admin-page/edit-product", { product });
});

router.post("/edit-product/", (req, res) => {
  //req.query.id user pass cheytha id edukkan
  //edit cheytha datayum id yum pass cheythu
  console.log(req.body);
  productHelper.updateProduct(req.query.id, req.body).then(() => {
    //data edit cheythu kazinjal admin lottu povum

    res.redirect("/admin");
  });

  console.log(req.query.id);
  if (req.files.Image) {
    //image undo ennu check cheyum
    let image = req.files.Image; //user ayacha image eduthu

    image.mv(
      "./public/product-images/" + req.query.id + ".jpg",
      (err, done) => {
        //ee ritiyil anu image edit cheyunathu user kodutha puthiya image pass cheytaha id vechu save cheyum
        console.log(req.query.id);
      }
    );
  }
});

router.get("/all-orders", verifyLogin, (req, res) => {
  productHelper.allOrders().then((allOrders) => {
    res.render("admin-page/all-orders", { allOrders });
  });
});

router.get("/all-users", verifyLogin, (req, res) => {
  productHelper.allUsers().then((allUsers) => {
    console.log(allUsers);
    res.render("admin-page/all-users", { allUsers });
  });
});

//admin login and signup

router.get("/ad-log", (req, res) => {
  if (req.session.loggedIn) {
    //user alredy login anengil true anu engil login vilikumbil '/' lottu redirerct cheyum
    res.redirect("/admin");
  } else {
    res.render("admin-page/admin-login", {}); //user:true koduthathu ithu user page anennanu paranjathu ivide post.login pass cheytha req.session.loginErr=true; avum ithu pagilottu pass cheyum
    req.session.loginErr = false; //mukalilatha work ayathinu shessham ithu false akkum
  }
  //user:true koduthathu ithu user page anennanu paranjathu ivide post.login pass cheytha req.session.loginErr=true; avum ithu pagilottu pass cheyum
});

router.post("/ad-log", (req, res) => {
  console.log(req.body);

  userHelpers.adminLoging(req.body).then((response) => {
    if (response.status) {
      //resolve vazi pass cheytha response true anengil if work avum false anengil else

      req.session.loggedIn = true; //user undo ennu check cheyum signtil request varumbol
      req.session.user = response.user; //user undengil user enna veriablil response.user le data eduthu

      res.redirect("/admin"); //nerathe ee router creatcheythu vechathu kondu athil povan paranju
    } else {
      //req.session.loginErr=true ithu matti req.session.loginErr='invalid username and password'
      req.session.loginErr = true; //ee email / password il user illengil true avum ithu 'get./login' lottu pass cheyum
      res.redirect("/admin/ad-log");
    }
  }); //login router pass cheyunna data edukkan
});

router.get("/ad-sign", (req, res) => {
  res.render("admin-page/admin-signup");
});

router.post("/ad-sign", (req, res) => {
  //signup router pass cheyunna data edukkan
  userHelpers.adminSignup(req.body).then((response) => {
    // console.log(resonse);
    req.session.loggedIn = true; //user undo ennu check cheyum signtil request varumbol
    req.session.user = response; //user pass cheyta data userl veykum itu accountil varum
    res.redirect("/admin");
  });
});
module.exports = router;
