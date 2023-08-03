// '/' pagil count kuttan
function addToCart(productID) {
  console.log(productID);
  $.ajax({
    url: "/add-to-cart/?id=" + productID,
    method: "get",
    success: (response) => {
      //alert(productID)

      if (response) {
        //add to cart buttonil click cheyumbol id eduthu kondu povunundengil cart spanil value kudanam
        let count = $("#cart-count").html(); //cart-countine id vechu vilichu
        count = parseInt(count) + 1; //id edukunundengil alredy ulla number kutanam
        $("#cart-count").html(count); //kutiya number vechu
      }
    },
  });
}

//quantity mattan

function changeQuantity(cartID, productID, userID, countNumber) {
  let quantity = parseInt(document.getElementById(productID).innerHTML); //ivide quantity spanil ippol ulla vaue (number) edukkan
  countNumber = parseInt(countNumber);
  console.log(userID);
  fetch("/change-productQuantity/", {
    method: "POST",
    body: JSON.stringify({
      //object ayitulla datye json akkan
      //pass cheyenda data
      user: userID,
      Cart: cartID,
      Product: productID,
      count: countNumber,
      quantity: quantity, //ippol quantity spanil ulla value eduthu vechu
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then(function (data) {
      console.log(data);
      if (data.removeProduct) {
        alert("product is removed");
        location.reload();
      } else {
        console.log(data);
        document.getElementById(productID).innerHTML = quantity + countNumber; //alredy ulla quantity yude kude count number kuttum
        document.getElementById("totalValue").innerHTML = data.total; //alredy ulla quantity yude kude count number kuttum
      }
    })
    .catch(function (error) {
      console.warn("Something went wrong.", error);
    });
}

//payment check out

const myForm = document.getElementById("checkout-form");

myForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // $.ajax({
  //   url:'/place-order',
  //   method:'post',
  //   data:$('#checkout-form').serialize(),//serialize paranja formil ninnum data edukkan
  //   success:(data)=>{
  //     console.log(data);
  //     alert(data)
  //   }
  // })

  const formData = new FormData(myForm);

  fetch("/place-order", {
    method: "post",
    body: formData,
  })
    .then(function (response) {
      if (response.ok) {
        // console.log(response);
        return response.json();
      }
      return Promise.reject(response);
    })
    .then(function (datas) {
      //console.log(datas);
      if (datas.orderStatus == "placed") {
        location.href = "/orders";
      } else {
        razorpayPayment(datas);
      }
    })
    .catch(function (error) {
      console.warn("Something went wrong.", error);
    });
});

function razorpayPayment(order) {
  var options = {
    key: "rzp_test_ntiAzJK99bT8ta", // Enter the Key ID generated from the Dashboard
    amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    currency: "INR",
    name: "Acme Corp",
    description: "Test Transaction",
    image: "https://example.com/your_logo",
    order_id: order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    handler: function (response) {
      alert(response.razorpay_payment_id);
      alert(response.razorpay_order_id);
      alert(response.razorpay_signature);

      verifyPayment(response,order);
    },
    prefill: {
      name: "Gaurav Kumar",
      email: "gaurav.kumar@example.com",
      contact: "9000090000",
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#3399cc",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}

function verifyPayment(payment,order){
  // console.log(payment,order);
  // $.ajax({
  //   url:'/verify-payment',
  //   data:{
  //     payment,
  //     order
  //   },
  //   method:'post'
  // })


fetch('/verify-payment', {
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({payment,order}),
})
  .then((response) => response.json())
  .then((data) => {
    if(data.status){
      location.href = "/orders";
    }else{
        alert('payment faild')
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}
