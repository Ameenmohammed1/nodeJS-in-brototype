const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
var userHelpers= require('../helpers/user-helpers')

/* GET home page. */
router.get('/',async function(req, res, next) {
  let users=req.session.user;//user login cheyumbol oru id creat cheythu nammude computeril store cheyum athinu oru validity koduthitundavum pinnidu user req cheyumbol ee id pass cheyum ee id iyil ulla email um passwordum undengil aa data eduthu kondu user variabilil veykukayum autometicly logim avukayum cheyum
 // console.log(users);

 let cartCount=null;//user login allengil null
if(req.session.user){//user undengil or user login anengil cart count edutha mathi
  cartCount=await userHelpers.getCartCount(req.session.user._id)//cartcount vazi userid pass cheythu cart dbyil ninnum ee id ulla usernte products arrayude length eduthu
 
}
productHelper.getAllProduct().then((product)=>{//all product function return cheytha data eduthu promis use cheythu
    //console.log(product);
    res.render("user-page/index", { user: true, product,users,cartCount}); //admin folderil ninnum view-product vilichu
   })
});



/***********LOGIN / SIGNUP************* */

router.get('/login',(req,res)=>{
  if(req.session.loggedIn){//user alredy login anengil true anu engil login vilikumbil '/' lottu redirerct cheyum
    res.redirect('/')
  }else{
    
    res.render("user-page/login",{ user: true,loginErr:req.session.loginErr})//user:true koduthathu ithu user page anennanu paranjathu ivide post.login pass cheytha req.session.loginErr=true; avum ithu pagilottu pass cheyum
    req.session.loginErr=false;//mukalilatha work ayathinu shessham ithu false akkum
}
})
router.get('/signup',(req,res)=>{
  res.render("user-page/signup",{ user: true })
})

router.post('/signup',(req,res)=>{//signup router pass cheyunna data edukkan
  userHelpers.doSignup(req.body).then((response)=>{
   // console.log(resonse);
   req.session.loggedIn=true;//user undo ennu check cheyum signtil request varumbol
      req.session.user=response//user pass cheyta data userl veykum itu accountil varum
   res.redirect('/')
  })
})

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){//resolve vazi pass cheytha response true anengil if work avum false anengil else
      
      req.session.loggedIn=true;//user undo ennu check cheyum signtil request varumbol
      req.session.user=response.user//user undengil user enna veriablil response.user le data eduthu


      res.redirect('/')//nerathe ee router creatcheythu vechathu kondu athil povan paranju
    }else{                  
      //req.session.loginErr=true ithu matti req.session.loginErr='invalid username and password'
      req.session.loginErr=true;//ee email / password il user illengil true avum ithu 'get./login' lottu pass cheyum
      res.redirect('/login')
    }
  })//login router pass cheyunna data edukkan
})


router.get('/logout',(req,res)=>{
  req.session.destroy()//serverilum computerilum undakkiya session eduthu kalayum /logout vilikumbol
  res.redirect('/')//ennittu / lottu povum
})

/*********CART************** */

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){//user alredy login anengil true anu engil login vilikumbil '/' lottu redirerct cheyum
    next()
  }else{ 
    res.redirect('/login')
}
}

router.get('/cart',verifyLogin,async(req,res)=>{
  let users=req.session.user;//ithu koduthale cartil varumbol login fagathu pereruthi kanikukayum cartil login avukayum ullu

  let cartCount=null;//user login allengil null
  if(req.session.user){//user undengil or user login anengil cart count edutha mathi
    cartCount=await userHelpers.getCartCount(req.session.user._id)//cartcount vazi userid pass cheythu cart dbyil ninnum ee id ulla usernte products arrayude length eduthu
   
  }
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let products=await userHelpers.getCartProduct(req.session.user._id)
 //console.log(users);
  res.render('user-page/cart',{ user: true,users,products,cartCount,total})//kittiya products detail passs cheythu
})

router.get('/add-to-cart/',(req,res)=>{
  //console.log(req.query.id);//user click cheytha productinte id
  //console.log(req.session.user._id);//login cheytha usernte id
  //console.log(req.query.id);//user pass cheytha data edukkum
  userHelpers.addToCart(req.query.id,req.session.user._id).then(()=>{//ivide user click cheytha productinte id yum login cheytha usernte idyum eduthu pass cheythu
      res.redirect('/')
  })

})

//****CHANGE PRODUCT QUANTITY CART */

router.post('/change-productQuantity/',async(req,res)=>{
 //console.log(req.body.Product);//fech il ninnum pass cheytha data
  await  userHelpers.changeProductQuantity(req.body).then(async(resonse)=>{
    //response objectil total value vum kudi veykum
     resonse.total = await userHelpers.getTotalAmount(req.body.user)//+,_ click cheyumbol userid yum pass avunnu response objectil total veykunnu
      res.send(resonse)//return kittiya data fech lottu pass cheythu
     
    })

})

router.get('/remove/',(req,res)=>{

 // console.log(req.query.id);//ithu cartinte id
 // console.log(req.query.cartid);//ithu deleat cheyenda product id

  productHelper.removeProduct(req.query.id,req.query.cartid).then((response)=>{
   // console.log(response);
  })
res.redirect('/cart')

})

/***PLACE ORDER****** */
router.get('/place-order',verifyLogin,async(req,res)=>{
  let users=req.session.user;
 let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user-page/order',{ user: true,total,users})
})

router.post('/place-order',async(req,res)=>{
  //console.log(req.body);
  let products =await userHelpers.getCartProductList(req.body.userId)
  let totalAmount = await userHelpers.getTotalAmount(req.body.userId)
 await userHelpers.placeOrder(req.body,products,totalAmount).then(async(response)=>{
 //  console.log(response);
 if (req.body['payment-method']=='COD') {//user select cheytha payment method cod anengil
  res.send({orderStatus:'placed'}) //script js il ithu send cheyanam
  //console.log(response);
 } else {
  let userId = req.body.userId;
 let orderID =response.insertedId; 
 await userHelpers.generateRazorpay(orderID,totalAmount).then((resonse)=>{
  //console.log(resonse); //pass cheyunna data edukkna 
  res.send(resonse)
  })
 }
  })
})
//Payment verify cheyan
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  /* ithanu data pass avunna rithi
 {
  payment: {
    razorpay_payment_id: 'pay_LJY5qJvwL8414q',
    razorpay_order_id: 'order_LJY5jjG7P0wp5V',
    razorpay_signature: 'b22d51011ccb3df79b840ace3b622f599c5f23b82b660914d905070d20a31c41'
  },
  order: {
    id: 'order_LJY5jjG7P0wp5V',
    entity: 'order',
    amount: 12345,
    amount_paid: 0,
    amount_due: 12345,
    currency: 'INR',
    receipt: '63f63c9132206b8e6a32a8e6',
    offer_id: null,
    status: 'created',
    attempts: 0,
    notes: [],
    created_at: 1677081740
  }
}
   */
  userHelpers.veryifyPayment(req.body).then((response)=>{
      userHelpers.changePaymentStatus(req.body.order.receipt).then(()=>{//payment succesfull ayal 
        console.log('Payment succesfull');
        res.send({status:true})
      })
  }).catch((err)=>{//payment succses allengil
    console.log(err);
      res.send({status:false,errMsg:''})
  })
})


/****ORDER PAGE***** */

router.get('/orders',verifyLogin,async(req,res)=>{
  let users=req.session.user;
  //getUserOrder ithu nee
 let allDetails=await userHelpers.allDetailsInOrder(req.session.user._id)
  userHelpers.getOrderProduct(req.session.user._id).then((OrderProducts)=>{
   console.log(OrderProducts);
    res.render('user-page/orders-page',{ user: true,users,OrderProducts,allDetails})
  })
})


router.get('/product-details',async(req,res)=>{
 // console.log(req.query.id); //pass cheytytha product id
 let product =await productHelper.getProductDetails(req.query.id).then()
 //console.log(product);
  res.render('user-page/product_details',{ user: true,product})
})

module.exports = router;
