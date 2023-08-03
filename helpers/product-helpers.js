var db=require('../config/connection')
var collections=require('../config/collections');
var objectId= require('mongodb').ObjectId;//delete cheyun data yude objectId creat cheyan

module.exports={

    addproduct:(product,callback)=>{
        product.Price=parseFloat(product.Price)//price string ayi anu varunna athine number akkan

        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data)=>{//mongodb yil shoping enna folderil product enna file creat cheythu athil user add-productil kodukunna data pass cheythu

            callback(data.insertedId);//admin pass cheytha store cheytha id thirichayachu

        })
    },
    getAllProduct:(callback)=>{//user pass cheytha product edukkan
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray();//user pass cheytha data eduthu array lotu matti
            resolve(products)
        })
    },
    deletProduct:(productID)=>{
        return new Promise((resolve)=>{
           // console.log(productID);
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:new objectId(productID)}).then((response)=>{//ivide user pass cheyta id eduthu objectId enna class inte akathu vechu ithu a id ulla document delete cheyum
               
                resolve()
            })
        })
    },
    getEditProductDetails:(EditProductId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new objectId(EditProductId)}).then((product)=>{
                //console.log(product);
                resolve(product)
            })
        })
    },
    updateProduct:(productId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).
            updateOne({_id:new objectId(productId)},{//user paranja id yil ulla data eduthu $set upayogichu Name.productDetails.Name edit cheytha value vechu ennittu resolve vilikkum
                $set:{
                    name:productDetails.Name,
                    Discriptin:productDetails.Discriptin,
                    Price:productDetails.Price,
                    Category:productDetails.Category
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    removeProduct:(cartID,productID)=>{
      return new Promise(async(resolve)=>{
      let cart =await db.get().collection(collections.CART_COLLECTION).findOne({_id:new objectId(cartID)})
        if(cart){
          //  console.log(productID);
          //  console.log(cartID);
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:new objectId(cartID)},
            {
                $pull:{products:{item:new objectId(productID)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
        }else{
            //console.log('error'+cart);
        }
      
      })
    },
    allOrders:()=>{
        return new Promise((resolve,reject)=>{
           let allOrders = db.get().collection(collections.ORDER_COLLECTOIN).find().toArray();
          // console.log(allOrders);

           resolve(allOrders)
        })
    },
    allUsers:()=>{
        return new Promise((resolve,reject)=>{
            let allUsers = db.get().collection(collections.USER_COLLECTION).find().toArray();
           // console.log(allOrders);
 
            resolve(allUsers)
         })
    },
    getProductDetails:(productID)=>{
        return new Promise(async(resolve,reject)=>{
            let productDetails =await db.get().collection(collections.PRODUCT_COLLECTION).find({_id:new objectId(productID)}).toArray()
           // console.log(productDetails);
            resolve(productDetails)
        })
    }
  
}