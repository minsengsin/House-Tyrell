const express = require('express');
const axios = require('axios');
const moment = require('moment');
const parser = require('body-parser');
const path = require('path');
const db = require('../database/models.js');
const Sequelize = require('sequelize');
const session = require('express-session');
const CronJob = require('cron').CronJob;
const multerS3 = require('multer-s3');
const multer = require('multer');
const aws = require('aws-sdk');
const config = require('../config.js');


const Op = Sequelize.Op;

const app = express();

const sess = {
  secret: 'tyrell',
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: false,
  },
  rolling: true,
};

app.use(session(sess));

const port = 3000;

app.use(parser.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

//* *************************** AMAZON S3 IMAGE STORAGE ************************

aws.config.update({
  secretAccessKey: config.S3_SECRET,
  accessKeyId: config.S3_KEY,
  region: 'us-east-1',
});
const s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'tyrell-pos',
    key: function(req, file, cb) {
      cb(null, `${new Date()}-${file.originalname}`);
    }
  }),
});

//* **************************** MIDDLEWARE ************************************
let auth = function(req, res, next) {
  if (req.session.employee) {
    next();
  } else {
    res.status(401).send();
  }
};

//* **************************** POST REQUESTS *********************************
app.post('/test', (req, res) => {
  db.Category.create({ category_name: 'Test2Test' })
    .then(() => {
      res.send('success');
    });
});

app.post('/delete/item', (req, res) => {
  console.log(req.body)
  db.Item.find({
    where: { item_name: req.body.item_name
    }
  }).then((found) => {
    found.destroy();
  })
})

app.post('/delete/category', (req, res) => {
  console.log(req.body)
  db.Category.find({
    where: {
      category_name: req.body.category_name
    }
  }).then((found) => {
    found.destroy();
  })
})

app.post('/create/item', upload.any(), (req, res) => {
  db.Item.create({
    item_name: req.body.item_name,
    item_price: req.body.item_price,
    item_image: req.files[0].location,
    item_ingredients: req.body.item_ingredients,
    item_category: req.body.item_category
  }).then(() => {
    res.send();
  })
  res.end();
})

app.post('/create/category', (req, res) => {
  db.Category.create({ category_name: req.body.category_name })
    .then(() => {
      res.send()
    })
})

app.post('/create/all', (req, res) => {

})



app.post('/completed/transaction', (req, res) => {
  const itemList = [];
  for (let i = 0; i < req.body.transactionItems.length; i += 1) {
    itemList.push(req.body.transactionItems[i].id)
  }
  let type;
  if (req.body.type) {
    type = true;
  } else { type = false; }
  let employee = JSON.parse(req.session.employee)
  let time = moment().format();
  let ingredientsList = [];

  db.Sale.create({
    sale_date: time,
    item_id: JSON.stringify(itemList),
    employee_id: employee,
    sale_amount: parseFloat(req.body.total),
    sale_cost: 50,
    sale_discount: req.body.discount,
    sale_cash: type
  }).then(() => {
    res.send();
  }).then(() => {
    db.Ingredient.findAll()
    .then((ing) => {
      ingredientsList = ing;
      transactionItems.forEach((item) => {
        item.item_ingredients.forEach((ing) => {
          ingredientsList[ing.ingredient_id-1].ingredient_left = ingredientsList[ing.ingredient_id-1].ingredient_left - ing.ingredient_amount
        })
      })

      ingredientsList.forEach((ing) => {
        db.Ingredient.update({
          where: {
            ingredient_id: ing.ingredient_id,
            ingredient_left: ing.ingredient_left,
          }
        })
      })
    })
  })
});


app.post('/clockout', (req, res) => {
  db.Timesheet.update({
    check_out: moment().format('MM/DD/YYYY, hh:mm:ss a'),
  }, {
    where: {
      employee_id: req.session.employee,
      check_out: null,
    },
  })
    .then(() => {
      req.session.destroy();
      res.status(200).send();
    })
    .catch((error) => {
      throw error;
    });
});

app.post('/newEmployee', (req, res) => {
  db.Employee.create({
    employee_id: req.body.newEmployeeId,
    employee_name: req.body.newEmployeeName,
    manager_privilege: req.body.managerLevel,
  })
    .then(() => {
      res.status(201).send();
    })
    .catch((error) => {
      throw error;
    });
});

app.post('/orderUp', (req, res) => {
  console.log('order req', req)
  db.Sale.update({
    sale_ready: true,
  }, {
    where: {
      id: req.body.id,
    },
  })
    .then((response) => {
      console.log('response from orderup on server: ', response)
      res.status(201).send();
    })
    .catch((error) => {
      throw error;
    });
});

app.post('/addIngredient', (req, res) => {
  db.Ingredient.find({
    where: { ingredient_name: req.body.ingredientName },
  })
    .then((result) => {
      if (result === null) {
        db.Ingredient.create({
          ingredient_name: req.body.ingredientName,
          order_number: req.body.orderNumber,
          ingredient_left: req.body.orderQuantity,
          ingredient_initial: req.body.orderQuantity,
          unit_cost: req.body.unitCost,
          ingredient_expire: req.body.expireDate,
          order_date: req.body.orderDate,
          ingredient_total: req.body.totalCost,
        });
      } else {
        db.Order.create({
          order_date: req.body.orderDate,
          order_name: req.body.ingredientName,
          order_number: req.body.orderNumber,
          order_initial: req.body.orderQuantity,
          order_left: req.body.orderQuantity,
          unit_cost: req.body.unitCost,
          order_expire: req.body.expireDate,
          order_total: req.body.totalCost,
        });
      }
    })
    .then(() => {
      res.status(201).send();
    })
    .catch((error) => {
      throw error;
    });
});

//* **************************** GET REQUESTS *********************************
// not working? attempt to redirect users who are not logged in

app.get('/fetch/currentOrders', (req, res) => {
  db.Sale.findAll({
    where: {
      sale_ready: false,
    },
  })
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

app.get('/fetch/items', (req, res) => {
  db.Item.findAll()
    .then((data) => {
      res.send(data);
    });
});

app.get('/fetch/categories', (req, res) => {
  db.Category.findAll()
    .then((data) => {
      console.log(data);
      res.send(data);
    });
});

app.get('/fetch/ingredients', (req, res) => {
  db.Ingredient.findAll()
  .then((data) => {
    res.send(data);
  });
});

app.get('/fetch/currentInventory', (req, res) => {
  db.Order.findAll({
    attributes: ['order_name', 'order_number', 'order_date', 'order_initial', 'order_left', 'order_expire', 'order_used'],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/inventory', (req, res) => {
  db.Ingredient.findAll({
    attributes: ['ingredient_name', 'order_number', 'order_date', 'ingredient_left', 'ingredient_initial', 'ingredient_expire'],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/ordercost', (req, res) => {
  db.Order.findAll({
    attributes: ['order_name', 'order_number', 'order_date', 'order_initial', 'unit_cost', 'order_total'],
    order: [['order_date', 'DESC']],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/inventorycost', (req, res) => {
  db.Ingredient.findAll({
    attributes: ['ingredient_name', 'order_number', 'order_date', 'ingredient_initial', 'unit_cost', 'ingredient_total'],
    order: [['order_date', 'DESC']],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/waste', (req, res) => {
  db.Order.findAll({
    attributes: ['order_name', 'order_date', 'order_number', 'order_initial', 'order_left', 'order_used'],
  }).then((data) => {
    res.send(data);
  });
});

app.get('/fetch/allsales', (req, res) => {
  db.Sale.findAll()
    .then((data) => {
      res.send(data);
    });
});

app.get('/fetch/allitems', (req, res) => {
  db.Item.findAll()
    .then((data) => {
      res.send(data);
    });
});

app.get('/fetch/employee', (req, res) => {
  db.Employee.findAll({
    where: {
      employee_id: req.query.PIN,
    },
  })
    .then((data) => {
      if (data.length === 0) {
        // invalid login
        res.status(404).send();
      } else {
        req.session.regenerate(() => {
          req.session.employee = req.query.PIN;
          res.send(data);
        });
      }
    })
    .then(() => {
      db.Timesheet.create({
        employee_id: req.query.PIN,
        check_in: moment().format('MM/DD/YYYY, hh:mm:ss a'),
      });
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/employeeInfo', auth, (req, res) => {
  db.Employee.findAll({
    where: {
      employee_id: req.session.employee,
    },
  })
    .then((data) => {
      res.send(data[0]);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/timeSheet', auth, (req, res) => {
  db.Timesheet.findAll({
    where: {
      employee_id: req.query.employeeId,
    },
  })
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/allEmployees', (req, res) => {
  db.Employee.findAll({
    order: [['employee_name', 'ASC']],
  })
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/allEmployees/clockedIn', (req, res) => {
  db.db.query(`SELECT a.employee_id, b.employee_name, a.check_in FROM Timesheets a INNER JOIN Employees b ON a.employee_id = b.employee_id WHERE a.check_out IS NULL AND a.check_in IS NOT NULL ORDER BY a.check_in DESC`)
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/fetch/allSales/today', (req, res) => {
  db.Sale.findAll()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get('/filter/category', auth, (req, res) => {
  db.Item.findAll({
    where: {
      item_category: req.query.category,
    },
  })
    .then((data) => {
      res.send(data);
    });
});

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
    if (err) res.status(500).send(err);
  });
});

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
//     if (err) res.status(500).send(err);
//   });
// });

app.post('/cronTest', (req, res) => {
  let currentTime = JSON.stringify(moment().format());
  currentTime = currentTime.substring(1, 11)
  let currentTimeParse = Date.parse(currentTime)
  let ingredients = [];
  let orders = [];
  let expired = [];
  let items = [];
  db.Ingredient.findAll({})
    .then((ing) => {
      ingredients = ing;
    }).then(() => {
      db.Order.findAll({
        where: { order_used: false },
        order: [['order_expire', 'ASC']]
      })
        .then((order) => {
          orders = order;
          console.log(orders, 'CRONCRONCRONCRONCRONCRON NEXT IS INGREDIENTS\n', ingredients)
          db.Item.findAll({})
          .then((menu) => {
            items = menu;
            for (let i = 0; i < ingredients.length; i += 1) {
              if (currentTimeParse > Date.parse(ingredients[i].ingredient_expire)) {
                expired.push(ingredients[i])
              }
            }

            for (let j = 0; j < expired.length; j += 1) {
              let foundIndex = orders.indexOf(orders.find((order, index) => {
                return order.order_name === expired[j].ingredient_name
              }))
              if (foundIndex === -1){
                for (let q = 0; q < items.length; q += 1) {
                  let ingredients = JSON.parse(items[q].item_ingredients);
                  let usesIngredient = ingredients.find(ing => {
                    return ing === expired[j].id
                  })
                  if(usesIngredient > -1) {
                    db.Item.update({
                      item_availability: false
                    },
                    { where: { item_name: items[q].item_name }}
                    )
                  }
                }
              } else {
                // expired item found at orders index foundIndex
                let temp = expired[j];
                db.Ingredient.update(
                  {
                    order_number: orders[foundIndex].order_number,
                    ingredient_left: orders[foundIndex].order_initial,
                    ingredient_initial: orders[foundIndex].order_initial,
                    unit_cost: orders[foundIndex].unit_cost,
                    ingredient_expire: orders[foundIndex].order_expire,
                    order_date: orders[foundIndex].order_date,
                    ingredient_total: orders[foundIndex].order_total,
                  },
                  { where: { ingredient_name: orders[foundIndex].order_name } }
                ).then(() => {
                  db.Order.update(
                    {
                    order_date: temp.order_date,
                    order_name: temp.ingredient_name,
                    order_number: temp.order_number,
                    order_initial: temp.ingredient_initial,
                    order_left: temp.ingredient_left,
                    unit_cost: temp.unit_cost,
                    order_expire: temp.ingredient_expire,
                    order_total: temp.ingredient_total,
                    order_used: 1,
                  },
                  { where: { order_number: orders[foundIndex].order_number }}
                ).then(() => {
                    res.send([orders, ingredients])
                  })
                })
              }
            }
          })
        });
    });
})


// ************************CRONJOB DONT TOUCH**********************/
const myCronJob = new CronJob('0 6 * * * *', () => {
  let currentTime = JSON.stringify(moment().format());
  currentTime = currentTime.substring(1, 11)
  let currentTimeParse = Date.parse(currentTime)
  let ingredients = [];
  let orders = [];
  let expired = [];
  let items = [];
  db.Ingredient.findAll({})
    .then((ing) => {
      ingredients = ing;
    }).then(() => {
      db.Order.findAll({
        where: { order_used: false },
        order: [['order_expire', 'ASC']]
      })
        .then((order) => {
          orders = order;
          db.Item.findAll({})
          .then((menu) => {
            items = menu;
            for (let i = 0; i < ingredients.length; i += 1) {
              if (currentTimeParse > Date.parse(ingredients[i].ingredient_expire)) {
                expired.push(ingredients[i])
              }
            }

            for (let j = 0; j < expired.length; j += 1) {
              let foundIndex = orders.indexOf(orders.find((order, index) => {
                return order.order_name === expired[j].ingredient_name
              }))
              if (foundIndex === -1){
                for (let q = 0; q < items.length; q += 1) {
                  let ingredients = JSON.parse(items[q].item_ingredients);
                  let usesIngredient = ingredients.find(ing => {
                    return ing === expired[j].id
                  })
                  if(usesIngredient > -1) {
                    db.Item.update({
                      item_availability: false
                    },
                    { where: { item_name: items[q].item_name }}
                    )
                  }
                }
              } else {
                // expired item found at orders index foundIndex
                let temp = expired[j];
                db.Ingredient.update(
                  {
                    order_number: orders[foundIndex].order_number,
                    ingredient_left: orders[foundIndex].order_initial,
                    ingredient_initial: orders[foundIndex].order_initial,
                    unit_cost: orders[foundIndex].unit_cost,
                    ingredient_expire: orders[foundIndex].order_expire,
                    order_date: orders[foundIndex].order_date,
                    ingredient_total: orders[foundIndex].order_total,
                  },
                  { where: { ingredient_name: orders[foundIndex].order_name } }
                ).then(() => {
                  db.Order.update(
                    {
                    order_date: temp.order_date,
                    order_name: temp.ingredient_name,
                    order_number: temp.order_number,
                    order_initial: temp.ingredient_initial,
                    order_left: temp.ingredient_left,
                    unit_cost: temp.unit_cost,
                    order_expire: temp.ingredient_expire,
                    order_total: temp.ingredient_total,
                    order_used: 1,
                  },
                  { where: { order_number: orders[foundIndex].order_number }}
                ).then(() => {
                    console.log('cronjobbeingrun')
                  })
                })
              }
            }
          })
        });
    });
}, null, true, 'America/Los_Angeles');
myCronJob.start();
// ************************NO TOUCH*******************************/

app.listen(port);
