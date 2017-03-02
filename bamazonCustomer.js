var mysql = require("mysql");
var inquirer = require("inquirer");
require('console.table');

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // username
  user: "root",

  // password
  password: "",
  database: "Bamazon_db"
});

var displayTable = [];  // global variable to hold db contents to be displayed
var availableProducts = [];
var productPriceStock = [];
var userProdSelect = "";
var userNumSelect = "";
var availProds = "";
var customerPrice = 0;

// connect to the database
connection.connect(function(err) {
  if (err) throw err;
  letsgo();  // solve the problem ....
});


var letsgo = function() {

  displayTable = [];  // global variable to hold db contents to be displayed
  availableProducts = [];
  productPriceStock = [];
  customerPrice = 0;

  connection.query('SELECT * FROM products', function(err, dbContent) {
    if (err) {
      console.log("error reading from db");
      return;
    }
    console.log("Here are things to sell");
    for (i = 0; i < dbContent.length; i ++) {
      var tempObject = {
        id:"",
        name:"",
        price:""
      };
      var tempNamePriceQuant = {
        name:"",
        price:"",
        stock: ""
      };
      tempObject.id = dbContent[i].item_id;
      tempObject.name = dbContent[i].product_name;
      tempObject.price = dbContent[i].price;

      tempNamePriceQuant.name = dbContent[i].product_name;
      tempNamePriceQuant.price = dbContent[i].price;
      tempNamePriceQuant.stock = dbContent[i].stock_quantity;

      pushIntoArray(tempObject);

      pushIntoProdArray(dbContent[i].product_name);  // array to be used to display just the product names to customer

      pushIntoPriceArray(tempNamePriceQuant);
    }
    // display available material to customer
    // console.log("displaying available material");
    console.table(displayTable);
    // console.log("\n");
    // console.table(availableProducts);
    // console.table(productPriceStock);
    inquirer.prompt([
      {
        name: "itemToBeBought",
        type: "rawlist",
        message: "What would you like to buy?",
        choices: availableProducts
      }
    ]).then(function(userProd){
      userProdSelect = userProd.itemToBeBought;
      inquirer.prompt({
        name:"quantityToBeBought",
        message:"How many would you like to buy?",
        validate: function(value) {
          if( (isNaN(value) === false) && (parseInt(value) > 0) ) {
            return true;
          }
          return false;
        }
      }).then(function(userQuant){
        userNumSelect = parseInt(userQuant.quantityToBeBought);
        console.log("Product user wants = " + userProdSelect);
        console.log("Number of prod user wants = " + userNumSelect);
        var query = "SELECT stock_quantity FROM products WHERE ?";
        connection.query(query, {product_name:userProdSelect}, function(err, availNumber){
          if (err) {
            console.log("error in getting availNumber");
            throw err;
          }
          availProds = parseInt(availNumber[0].stock_quantity);
          if(availProds < userNumSelect) {
            console.log("Insufficient Quantity");
          	console.log("Quantity Available = " + availProds);
            letsgo();
          } else if (availProds >= userNumSelect) {
            availProds -= userNumSelect;  // reduce available stock
            // console.log("Quantity Available = " + availProds);
	        var query = "SELECT price FROM products WHERE ?";
	        connection.query(query, {product_name:userProdSelect}, function(err, prodPrice){
	          if (err) {
	            console.log("error in getting product Price");
	            throw err;
	          } else {
	          	// console.log(prodPrice);
	          	// console.log(prodPrice[0].price);
	          	customerPrice = parseFloat(prodPrice[0].price) * userNumSelect;
	            console.log("You bought " + userNumSelect + " " + userProdSelect + " for $ " + customerPrice);
	            var query = "SELECT product_sales FROM products WHERE ?";
	            connection.query(query, {product_name:userProdSelect}, function(err, result) {
	            	  if(err) {
	            	  	console.log("error getting total sales");
	            	  	return;
	            	  } else {
	            	  	result = parseInt(result) + customerPrice;
	            	  }
	            })
	          }
	        });  // get product price from DB
            var query = "UPDATE products SET stock_quantity = ? WHERE product_name = ?";
            connection.query(query, [availProds, userProdSelect], function(err, result) {
              if (err) {
                console.log("error updating database");
                throw err;
              }
              letsgo();
            });
          }
        });
      }); // after receiving # desired by user
    });  // after receiving product desired by user
  });  // after very first connection request for db contents
}

var pushIntoArray = function(dbObject) {
  displayTable.push(dbObject);
}

var pushIntoProdArray = function(prodName) {
  availableProducts.push(prodName);
}

var pushIntoPriceArray = function(priceObject) {
  productPriceStock.push(priceObject);
}