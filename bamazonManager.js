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
var managerOptions = ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"];
var prodToAdd = "";

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


  inquirer.prompt([
    {
      name: "managerChoice",
      type: "rawlist",
      message: "What would you like to do?",
      choices: managerOptions
    }
  ]).then(function(managerChose){
    var managerChoice = managerChose.managerChoice;
    if (managerChoice === "View Products for Sale") {
      connection.query('SELECT * FROM products', function(err, dbContent) {
        if (err) {
          console.log("error reading from db");
          return;
        } else {
          console.table(dbContent);
          letsgo();
        }
      });  // if manager selects view
    } else if (managerChoice === "View Low Inventory"){
      connection.query("SELECT * FROM products WHERE stock_quantity < '6'", function(err, dbContent) {
        if (err) {
          console.log("error reading from db");
          connection.end();
          return;
        } else {
          if (dbContent.length > 0) {
            console.table(dbContent);
            letsgo();
          } else {
            console.log("No stock less than five");
            letsgo();
          }
        }
      });  // if manager selects view
    } else if (managerChoice === "Add to Inventory") {
      console.log("add to Inventory selected");
      connection.query("SELECT * FROM products", function(err, dbContent) {
        if (err) {
          console.log("error reading from db");
          connection.end();
          return;
        } else {
          // array to be used to display just the product names to customer
          for (i = 0; i < dbContent.length; i ++) {
            // console.log(dbContent[i].product_name);
            pushIntoProdArray(dbContent[i].product_name);
          }

          inquirer.prompt([
            {
              name: "prodToAdd",
              type: "rawlist",
              message: "What would you like to add?",
              choices: availableProducts
            }
          ]).then(function(managerToAdd){
            prodToAdd = managerToAdd.prodToAdd;
            console.log("product to add = " + prodToAdd);
            inquirer.prompt([
              {
                name: "numToAdd",
                message: "How many would you like to add?",
                validate: function(value) {
                  if ( (isNaN(value) === false) && (parseInt(value) >0) ) {
                    return true;
                  }
                  return false;
                }
              }
            ]).then(function(managerAddNum){
              numToAdd = parseInt(managerAddNum.numToAdd);
              console.log("to be added number = " + numToAdd);
              console.log("to be added product = " + prodToAdd);
              var query = "SELECT stock_quantity FROM products WHERE ?";
              connection.query(query, {product_name:prodToAdd}, function(err, numInDb){
                if (err) {
                  console.log("error selecting stock_quantity");
                } 
                else {
                  // console.log("success selecting stock quantity");
                  // console.log(numInDb);
                  var availNum = parseInt(numInDb[0].stock_quantity);
                  console.log("existing number = " + availNum);
                  availNum += numToAdd;
                  console.log("Updated quantity = " + availNum);
                  var query = "UPDATE products SET stock_quantity = ? WHERE product_name = ?";
                  connection.query(query, [availNum, prodToAdd], function(err, result){
                    if (err) {
                      console.log("error updating database");
                      connection.end();
                      return;
                    } 
                    else {
                      letsgo();
                    }
                  });
                }  
              })
            })
          });
        }
      });
    } else if (managerChoice === "Add New Product") {

    }else {
      // do default work
    }
  });
} 

var pushIntoProdArray = function(prodName) {
  availableProducts.push(prodName);
}

//     inquirer.prompt({
//       name:"quantityToBeBought",
//       message:"How many would you like to buy?",
//       validate: function(value) {
//         if( (isNaN(value) === false) && (parseInt(value) > 0) ) {
//           return true;
//         }
//         return false;
//       }
//     }).then(function(userQuant){



//   connection.query('SELECT * FROM products', function(err, dbContent) {
//     if (err) {
//       console.log("error reading from db");
//       return;
//     }
//     console.log("Here are things to sell");
//     for (i = 0; i < dbContent.length; i ++) {
//       var tempObject = {
//         id:"",
//         name:"",
//         price:""
//       };
//       var tempNamePriceQuant = {
//         name:"",
//         price:"",
//         stock: ""
//       };
//       tempObject.id = dbContent[i].item_id;
//       tempObject.name = dbContent[i].product_name;
//       tempObject.price = dbContent[i].price;

//       tempNamePriceQuant.name = dbContent[i].product_name;
//       tempNamePriceQuant.price = dbContent[i].price;
//       tempNamePriceQuant.stock = dbContent[i].stock_quantity;

//       pushIntoArray(tempObject);


//       pushIntoPriceArray(tempNamePriceQuant);
//     }
//     // display available material to customer
//     // console.log("displaying available material");
//     console.table(displayTable);
//     // console.log("\n");
//     // console.table(availableProducts);
//     // console.table(productPriceStock);
//     inquirer.prompt([
//       {
//         name: "itemToBeBought",
//         type: "rawlist",
//         message: "What would you like to buy?",
//         choices: availableProducts
//       }
//     ]).then(function(userProd){
//       userProdSelect = userProd.itemToBeBought;
//       inquirer.prompt({
//         name:"quantityToBeBought",
//         message:"How many would you like to buy?",
//         validate: function(value) {
//           if( (isNaN(value) === false) && (parseInt(value) > 0) ) {
//             return true;
//           }
//           return false;
//         }
//       }).then(function(userQuant){
//         userNumSelect = parseInt(userQuant.quantityToBeBought);
//         console.log("Product user wants = " + userProdSelect);
//         console.log("Number of prod user wants = " + userNumSelect);
//         var query = "SELECT stock_quantity FROM products WHERE ?";
//         connection.query(query, {product_name:userProdSelect}, function(err, availNumber){
//           if (err) {
//             console.log("error in getting availNumber");
//             throw err;
//           }
//           availProds = parseInt(availNumber[0].stock_quantity);
//           if(availProds < userNumSelect) {
//             console.log("Insufficient Quantity");
//           	console.log("Quantity Available = " + availProds);
//             letsgo();
//           } else if (availProds >= userNumSelect) {
//             availProds -= userNumSelect;  // reduce available stock
//             // console.log("Quantity Available = " + availProds);
// 	        var query = "SELECT price FROM products WHERE ?";
// 	        connection.query(query, {product_name:userProdSelect}, function(err, prodPrice){
// 	          if (err) {
// 	            console.log("error in getting product Price");
// 	            throw err;
// 	          } else {
// 	          	// console.log(prodPrice);
// 	          	// console.log(prodPrice[0].price);
// 	          	customerPrice = parseFloat(prodPrice[0].price) * userNumSelect;
// 	            console.log("You bought " + userNumSelect + " " + userProdSelect + " for $ " + customerPrice);
// 	          }
// 	        });  // get product price from DB
//             var query = "UPDATE products SET stock_quantity = ? WHERE product_name = ?";
//             connection.query(query, [availProds, userProdSelect], function(err, result) {
//               if (err) {
//                 console.log("error updating database");
//                 throw err;
//               }
//               letsgo();
//             });
//           }
//         });
//       }); // after receiving # desired by user
//     });  // after receiving product desired by user
//   });  // after very first connection request for db contents
// }

// var pushIntoArray = function(dbObject) {
//   displayTable.push(dbObject);
// }



// var pushIntoPriceArray = function(priceObject) {
//   productPriceStock.push(priceObject);
// }