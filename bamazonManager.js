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
      connection.query('SELECT * FROM products', function(err, dbContent) {
        if (err) {
          console.log("error reading from db");
          return;
        } else {
          console.table(dbContent);  // display available products
          inquirer.prompt([
            {
              name: "nameItemToBeAdded",
              message: "Name of Product to be added: ",
              validate: function(value) {
                if (value != "") {
                  return true;
                } else {
                  return false;
                }
              }
            },
            {
              name: "idItemToBeAdded",
              message: "ID of Product to be added: "
            },
            {
              name: "priceItemToBeAdded",
              message: "Price of Item to be added: "
            },
            {
              name: "quantityItemToBeAdded",
              message: "Stock of Item to be added: "
            },
            {
              name: "departmentItemToBeAdded",
              message: "Department Name for Item to be added: "
            }
          ]). then(function(answers) {
            var itemName = answers.nameItemToBeAdded;
            var itemId = answers.idItemToBeAdded;
            var itemPrice = answers.priceItemToBeAdded;
            var itemQuantity = answers.quantityItemToBeAdded;
            var itemDepartment = answers.departmentItemToBeAdded;
            var query = "INSERT INTO products (item_id, product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?, ?)";
            connection.query(query, [itemId, itemName, itemDepartment, itemPrice, itemQuantity], function(err, result){
              if (err) {
                console.log("error adding row to table");
                return;
              } else {
                letsgo();
              }
            })
          })
        }
      });  // if manager selects view
    } 
    else {
      console.log("why am i here?")  // do default work
      letsgo();
    }
  });
} 

var pushIntoProdArray = function(prodName) {
  availableProducts.push(prodName);
}