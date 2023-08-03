var collections=require('../config/collections');
var db=require('../config/connection')
const bcrypt= require('bcrypt');//user tharunna password polathe data encode chethu db yil sukshikanum thrichu edukkumbol decode cheyanum upayogikkunu
const { ObjectId } = require('mongodb');//id vechu data edukkan
var Promise = require('promise');
const { response } = require('express');
var Razorpay = require('razorpay');
const { resolve, reject } = require('promise');

//razorpay
var instance = new Razorpay({
    key_id: "your key_id",
    key_secret: "your secret key",
  });

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10);
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                //console.log(userData);
                resolve(userData)//db yil document creat cheythatinu shesham user pass cheyta data return cheyum
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={}
            let user=await db.get().collection(collections.USER_COLLECTION).findOne({Email:userData.Email})//databasel ulla emaillil user thanna email undo ennu check cheyum chilappol true / false

            if(user){//user thanna email db yil undengil if work avum
                bcrypt.compare(userData.Password,user.Password).then((status)=>{//ini userthanna passwordum ippol eduthha email inte akathulla passwordumayi login cheythapol kittiya password compare cheyum chilappol true/false
                    if(status){//user thanna password db yil undengil if work avum
                        //console.log('login succes');
                        response.user=user;//response enna objectil databasil ninnum edutha data vechu user details
                        response.status=true;
                        resolve(response)//user undengil dologin promis vazi response.status=true ennu passcheyum

                    }else{
                       // console.log('login faild');
                        resolve({status:false})//user illengil dologin promis vazi response.status=false ennu passcheyum
                    }
                })
            }else{//user thanna email illengil
               // console.log('email error');
                resolve({status:false})//user illengil dologin promis vazi response.status=false ennu passcheyum
            }
        })
    },
    addToCart:(productID,userID)=>{
        let productObject={
            item:new ObjectId(productID),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userID)})//db pass cheytha userID vechulla cart undo ennu check cheyum

            if(userCart){//userID vechulla cart undengil
                let productExisist=userCart.products.findIndex(product=> product.item==productID)//dbyil products nte akathu user nerathe ee id ulla product save cheythitundengil vendum aa productil adtocart click cheyumbol dbyile product id yum user pass cheytha productid yum check cheythu ee product undengil undennu undenum Arr index numberum kanikum ee proid yil ulla product illengil -1 kanikum


               if(productExisist!=-1){// '!=-1" koduthathu -1 anu productExisist tharunathengil product illa -1 alla productExisist varunathengil ee product alredy und

                db.get().collection(collections.CART_COLLECTION).updateOne({user:new ObjectId(userID),"products.item":new ObjectId(productID)},//ee userid yum product id yum vechulla data edukkum
                {
                    $inc:{'products.$.quantity':1}//inc ennal increment products.quantity value increment cheyum 1 koduthathu oro vatavum addtocart click cheyumbol ee idyil ulla productinte quantity 1 vechu kudum
                    //$.quantity oru arrayil ulla item edukunathu ee rithiyil anu
                })

               }else{//productid vechulla product illengil productObject ithilulla data productsinte akathu veykum
                db.get().collection(collections.CART_COLLECTION).updateOne({user:new ObjectId(userID)},
                {
                
                   $push:{//ivide dataupdate cheyan alla product enna arrayil veendum user click cheytha productine id store cheyan anu $push upayogikunna
                    
                    products:productObject
                
                }
                    
                }
                ).then((response)=>{
                    resolve()
                })

            }

            }else{//userID vechu user illengil cart enna dbyil usernte id yum user click cheytha product id yum vechu object db yil creat cheyum
                let cartObj={
                    user:new ObjectId(userID),
                    products:[productObject]
                }

                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }

        })
    },
    getCartProduct:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([//aggregate upayogikunathu  oru dbyil ninnum vereoru dbiyile data edukkan
                {
                    $match:{user:new ObjectId(userID)}
                },
                {
                    $unwind:'$products', //ivide usercartil ninnum products array edukkum
                },
                {
                    $project:{//ivide oro productineyum objectid yum item um quantity yum vechu array akkum oro productum
                        item:'$products.item',
                        quantity:'$products.quantity',
                        /*
                        Egsample:
                                                        [
                                {
                                    _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                    item: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                    quantity: 2
                                },
                                {
                                    _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                    item: new ObjectId("63eb9424eee47b7095a4cf9b"),
                                    quantity: 2
                                },
                                {
                                    _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                    item: new ObjectId("63eb9efdbfc8a8d6948e9bf0"),
                                    quantity: 2
                                }
                                ]
                        */
                    }
                   
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,//ini ee dbyil ponam
                        localField:'item',//cartil ninum product id eduthu mukalil item enuperukodutha data
                        foreignField:'_id',//cartile product id vechulla data product store cheytha dbyil poyi eduthukondu varum
                        as:'NewProduct'//kondu vanna data ee peruvechulla arrayil save cheyum

                        /**
                         EXAMPLE:
                                [
                                                    {
                                _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                item: new ObjectId("63eb9424eee47b7095a4cf9b"),
                                quantity: 2,
                                products: [ [Object] ]
                            }
                        ]
                         */
                    }
                },
                {
                    $project:{                                      //ivide ulla data object ayi eduthu veykanam
                            item:1,quantity:1,product:{$arrayElemAt:['$NewProduct',0]}//ivide 1 koduthathu mukalil kittiya newproductil ninum edukan ulla datayku 1 kodukanam pneed product enna objectil user add cheytha productid yude data veykum

                            //product arrayil ulla oro objectid yil ninum data edukkum
                            /**
                             * EGSAMPLE:
                             *   {
                                        _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                        item: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                        quantity: 2,
                                        product: {
                                        _id: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                        Name: 'i phone',
                                        Category: 'mobile',
                                        Price: '$12000',
                                        Discriptin: 'this is good product'
                                        }
                                    },
                             */
                    }
                }
            
            ]).toArray()
            //console.log(cartItems);
            resolve(cartItems)


        })
    },
    getCartCount:(userID)=>{
        return new Promise(async(resolve)=>{
            let count=0;
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userID)})//ee idyil cart undo ennu check cheyum ennitu aa id yil ulla data edukkum
            if(cart){//cartil data undengil
                
                count=cart.products.length;//add cheytha product array de length eduthu countil veykum
            }
         
            resolve(count)//etra product und ennu pass cheyum
        })
    },
    changeProductQuantity:(cartDetails)=>{//{cartID,productID,Count} ivide objectil varuna value ne destructure cheythu perunalki
      //  console.log(cartDetails);
        cartDetails.count = parseInt(cartDetails.count)//user number pass cheyunathu sring ayitanu athine intiger akkan
        cartDetails.quantity=parseInt(cartDetails.quantity)
        return new Promise((resolve)=>{
             // console.log(cartDetails.count,cartDetails.quantity,);
            if(cartDetails.count == -1 && cartDetails.quantity ==1){//spanil ulla quantity 1 um countile data -1 ayal 
                db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(cartDetails.Cart)},
                {
                    $pull:{products:{item:new ObjectId(cartDetails.Product)}}//pull upayogikunathu arrayile data remove cheyan products arrayile item tile value ithu cartDetails.product ayal athu delete cheyum
                }).then(()=>{
                    
                    resolve({removeProduct:true})//ividennu ee value pass cheyum
                })
            }else{
                db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(cartDetails.Cart),"products.item":new ObjectId(cartDetails.Product)},
                {
                                                //count 1 ayal increment -1 ayan decrement
                    $inc:{'products.$.quantity':cartDetails.count}//inc ennal increment products.quantity value increment cheyum 1 koduthathu oro vatavum addtocart click cheyumbol ee idyil ulla productinte quantity 1 vechu kudum
                    //$.quantity oru arrayil ulla item edukunathu ee rithiyil anu
                }).then(()=>{
                    resolve({updateQuantity:true})
                })
            }

        })
    },
    getTotalAmount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let total=await db.get().collection(collections.CART_COLLECTION).aggregate([//aggregate upayogikunathu  oru dbyil ninnum vereoru dbiyile data edukkan
                {
                    $match:{user:new ObjectId(userID)}
                },
                {
                    $unwind:'$products', //ivide usercartil ninnum products array edukkum
                },
                {
                    $project:{//ivide oro productineyum objectid yum item um quantity yum vechu array akkum oro productum
                        item:'$products.item',
                        quantity:'$products.quantity',
                       
                    }
                   
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,//ini ee dbyil ponam
                        localField:'item',//cartil ninum product id eduthu mukalil item enuperukodutha data
                        foreignField:'_id',//cartile product id vechulla data product store cheytha dbyil poyi eduthukondu varum
                        as:'NewProduct'//kondu vanna data ee peruvechulla arrayil save cheyum

                      
                    }
                },
                {
                    $project:{                                      //ivide ulla data object ayi eduthu veykanam
                            item:1,quantity:1,product:{$arrayElemAt:['$NewProduct',0]}//ivide 1 koduthathu mukalil kittiya newproductil ninum edukan ulla datayku 1 kodukanam pneed product enna objectil user add cheytha productid yude data veykum
                           /**
                             * EGSAMPLE:
                             *   {
                                        _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                        item: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                        quantity: 2,
                                        product: {
                                        _id: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                        Name: 'i phone',
                                        Category: 'mobile',
                                        Price: '$12000',
                                        Discriptin: 'this is good product'
                                        }
                                    },
                             */
                           
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}//ivide group akkunathu oro objectil ninnum quantity yum price um eduthu gunichu ellathineyum group akki athinte sum kanum

                        /**
                         * 
                         * Example
                         *[ { _id: null, total: 71588 } ]
                         */
                    }
                }
               
            
            ]).toArray()
           //console.log(total[0].total);
          resolve(total[0].total)
            } catch (error) {
                resolve(0)
            }
            
        })
    },
    placeOrder:(order,products,totalAmount)=>{
        return new Promise(async(resolve,reject)=>{
            let status = order['payment-method']==='COD'?'placed':'pending';//payment-method cod anengil status veriabilil placed ennu kanikkum
            //['payment-method'] objectinte akathu ethengilum key string ('') ayi varunundengil [] array kullil vilukkum
            let orderObj={
                deliveryDetails:{
                    monile:order.Mobile,
                    address:order.Address,
                    pincode:order.Pincode
                },
                userId:new ObjectId(order.userId),
                PaymentMethod:order['payment-method'],
                products:products,
                totalAmount:totalAmount,
                status:status,
                date:new Date()
            }

           await db.get().collection(collections.ORDER_COLLECTOIN).insertOne(orderObj).then(async(response)=>{
              await  db.get().collection(collections.CART_COLLECTION).deleteOne({user:new ObjectId(order.userId)})
              //console.log(response);
              resolve(response) //order id pass cheyan
            })
        })

    },

    getCartProductList:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let Cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userID)}).then((response)=>{
               resolve(response.products)
            })
            
        })
    },
    getOrderProduct:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let OrderItems=await db.get().collection(collections.ORDER_COLLECTOIN).aggregate([//aggregate upayogikunathu  oru dbyil ninnum vereoru dbiyile data edukkan
                {
                    $match:{userId:new ObjectId(userID)}
                },
                {
                    $unwind:'$products', //ivide usercartil ninnum products array edukkum
                },
                {
                    $project:{//ivide oro productineyum objectid yum item um quantity yum vechu array akkum oro productum
                        item:'$products.item',
                        quantity:'$products.quantity',
                       
                        /*
                        Egsample:
                                                        [
                                {
                                    _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                    item: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                    quantity: 2
                                },
                                {
                                    _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                    item: new ObjectId("63eb9424eee47b7095a4cf9b"),
                                    quantity: 2
                                },
                                {
                                    _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                    item: new ObjectId("63eb9efdbfc8a8d6948e9bf0"),
                                    quantity: 2
                                }
                                ]
                        */
                    }
                   
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,//ini ee dbyil ponam
                        localField:'item',//cartil ninum product id eduthu mukalil item enuperukodutha data
                        foreignField:'_id',//cartile product id vechulla data product store cheytha dbyil poyi eduthukondu varum
                        as:'NewProduct'//kondu vanna data ee peruvechulla arrayil save cheyum

                        /**
                         EXAMPLE:
                                [
                                                    {
                                _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                item: new ObjectId("63eb9424eee47b7095a4cf9b"),
                                quantity: 2,
                                products: [ [Object] ]
                            }
                        ]
                         */
                    }
                },
                {
                    $project:{                                      //ivide ulla data object ayi eduthu veykanam
                            item:1,quantity:1,product:{$arrayElemAt:['$NewProduct',0]}//ivide 1 koduthathu mukalil kittiya newproductil ninum edukan ulla datayku 1 kodukanam pneed product enna objectil user add cheytha productid yude data veykum

                            //product arrayil ulla oro objectid yil ninum data edukkum
                            /**
                             * EGSAMPLE:
                             *   {
                                        _id: new ObjectId("63ee4ff238440a7870a6b2e9"),
                                        item: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                        quantity: 2,
                                        product: {
                                        _id: new ObjectId("63eb9419eee47b7095a4cf9a"),
                                        Name: 'i phone',
                                        Category: 'mobile',
                                        Price: '$12000',
                                        Discriptin: 'this is good product'
                                        }
                                    },
                             */
                    }
                }
            
            ]).toArray()
            //console.log(cartItems);
            resolve(OrderItems)


        })
    },
    allDetailsInOrder:(userid)=>{
        return new Promise(async(resolve,reject)=>{
           await db.get().collection(collections.ORDER_COLLECTOIN).findOne({userId:new ObjectId(userid)}).then((response)=>{
              //  console.log(response);
              resolve(response)
            })
        })
    },
    generateRazorpay:(userId,totalAmount)=>{
        return new Promise((resolve)=>{
            var options = {
                amount: totalAmount*100,  // 50.6 ithu ozuvakki 50600
                currency: "INR",
                receipt: userId.toString(),
              };
              instance.orders.create(options, function(err, order) {
                //console.log(order);
                if(err){
                    console.log(err)
                    resolve(err)
                }else{
                    /*
                    {
                        id: 'order_LJ8NwYCkvy61Wr',
                        entity: 'order',
                        amount: 9999,
                        amount_paid: 0,
                        amount_due: 9999,
                        currency: 'INR',
                        receipt: '63ea6b343057a8db00b07f16',
                        offer_id: null,
                        status: 'created',
                        attempts: 0,
                        notes: [],
                        created_at: 1676991212
                        }
                    *///ithu pole order creat ayi
                    resolve(order)
                }
              });
           
        })
    },
    veryifyPayment:(details)=>{
        return new Promise((resolve)=>{
            var crypto = require("crypto");                         //api secreat key
            var hmac = crypto.createHmac('sha256', 'iRWlMFGm0nyf4mebqPJHJ8r8')
            hmac.update(details.payment.razorpay_order_id+'|'+details.payment.razorpay_payment_id)//ivide verify cheyunnu
            hmac=hmac.digest('hex')//data hex akki mattunnu
            if(hmac==details.payment.razorpay_signature){
                resolve()//correct anengil
            }else{
                reject()//correct allengil 
            }

        })
    },
    changePaymentStatus:(orderID)=>{
        return new Promise((resolve,reject)=>{
            console.log('changePaymentStatus'+orderID);
            db.get().collection(collections.ORDER_COLLECTOIN)
            .updateOne({_id:new ObjectId(orderID)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    },
    getUserOrder:(userID)=>{
        return new Promise(async(resolve)=>{
            let orders = await db.get().collection(collections.ORDER_COLLECTOIN)
            .find({userId:new ObjectId(userID)}).toArray()
            resolve(orders)
        })
    },
    getProductss:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([//aggregate upayogikunathu  oru dbyil ninnum vereoru dbiyile data edukkan
                {
                    $match:{user:new ObjectId(userID)}//ee user undo ennu nokki data edukunnu cartile ee useril ninanu id edukunathu
                },
                {
                    $lookup:{//ini match cheythu kittiya objectil ninnum productId vechu product store cheytha dbyil poyi data edukkan povukaya
                        from:collections.PRODUCT_COLLECTION,//product storcheytha db yil poyi
                        let:{productList:'$products'},//productList enna veriabilil cartil ninnedutha product id vechu
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',"$$productList"]//ivide cart db yil ninnumkittiya product id vechu product store cheytha dbyil aa id vechulla data eduthu
                                        
                                    }
                                }
                            }
                        ],
                        as:'cartItem'//product store cheytha dbyil ninnum kittiya data cartItem ennu peru koduthu save cheythu
                    }
                }
            ]).toArray()
           //console.log(cartItems);result:
           /*
                        [
                            {
                    _id: new ObjectId("63ebb90c2c3aebbea4e3bb5e"),
                    user: new ObjectId("63ea6b343057a8db00b07f16"),
                    products: [
                    new ObjectId("63eb9419eee47b7095a4cf9a"),
                    new ObjectId("63eb9424eee47b7095a4cf9b")
                    ],
                    cartItems: [ [Object], [Object] ]
                }
                ]
           */

            resolve(cartItems[0].cartItem)//pass cheytha arrayil ninnum cartItem mathram pass cheythal mati


           // resolve(cartItems[0].cartItems) result:
           /*
           [
            {
              _id: new ObjectId("63eb9419eee47b7095a4cf9a"),
              Name: 'i phone',
              Category: 'mobile',
              Price: '$12000',
              Discriptin: 'this is good product'
            },
            {
              _id: new ObjectId("63eb9424eee47b7095a4cf9b"),
              Name: 'redmi',
              Category: 'mobile',
              Price: '$12000',
              Discriptin: 'this is good product in redmi'
            }
          ]
          */

         


          //unwind upayogichtu objectid yum userid yum vechu productine seprate cheyum
                    /*EGSAMPLE:
                        [
                                  {
                                _id: new ObjectId("63ee3aac385d0c4a825376ba"),        
                                user: new ObjectId("63ea6b343057a8db00b07f16"),       
                                products: { item: new ObjectId("63eb9efdbfc8a8d6948e9bf0"), quantity: 2 }
                            },
                            {
                                _id: new ObjectId("63ee3aac385d0c4a825376ba"),        
                                user: new ObjectId("63ea6b343057a8db00b07f16"),       
                                products: { item: new ObjectId("63eba3c81a097681d7274717"), quantity: 1 }
                            }
                        ]    
                    */

        })
    },
    adminSignup:(adminData)=>{
    return new Promise(async(resolve,reject)=>{
        adminData.Password=await bcrypt.hash(adminData.Password,10);//code bycript cheyum 
        db.get().collection(collections.ADMIN_COLLECTION).insertOne(adminData).then((data)=>{
            //console.log(userData);
            resolve(adminData)//db yil document creat cheythatinu shesham user pass cheyta data return cheyum
        })
    })
   },
   adminLoging:(adminLogin)=>{
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false;
        let response={}
        let user=await db.get().collection(collections.ADMIN_COLLECTION).findOne({Email:adminLogin.Email})//databasel ulla emaillil user thanna email undo ennu check cheyum chilappol true / false

        if(user){//user thanna email db yil undengil if work avum
            bcrypt.compare(adminLogin.Password,user.Password).then((status)=>{//ini userthanna passwordum ippol eduthha email inte akathulla passwordumayi login cheythapol kittiya password compare cheyum chilappol true/false
                if(status){//user thanna password db yil undengil if work avum
                    //console.log('login succes');
                    response.user=user;//response enna objectil databasil ninnum edutha data vechu user details
                    response.status=true;
                    resolve(response)//user undengil dologin promis vazi response.status=true ennu passcheyum

                }else{
                   // console.log('login faild');
                    resolve({status:false})//user illengil dologin promis vazi response.status=false ennu passcheyum
                }
            })
        }else{//user thanna email illengil
           // console.log('email error');
            resolve({status:false})//user illengil dologin promis vazi response.status=false ennu passcheyum
        }
    })
   }
    
}
