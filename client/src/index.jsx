import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route } from 'react-router';
import createHistory from 'history/createBrowserHistory';

import App from './components/app.jsx';
import ManagerHome from './components/managerHome.jsx';
import InventoryInfo from './components/inventoryInfo.jsx';
import EmployeeInfo from './components/employeeInfo.jsx';
import SaleInfo from './components/saleInfo.jsx';
import Login from './components/login.jsx';
import TransactionCredit from './components/transactionCredit.jsx';
import SaleControl from './components/saleControl.jsx';

const history = createHistory();

ReactDOM.render(
  <div>
    <Router history={history}>
      <div>
        <Route exact path="/" component={Login} />
        <Route path="/salesScreen" component={App} />
        <Route path="/managerhome" component={ManagerHome} />
        <Route path="/employeeinfo" component={EmployeeInfo} />
        <Route path="/inventoryinfo" component={InventoryInfo} />
        <Route path="/saleinfo" component={SaleInfo} />
        <Route path="/transaction/credit" component={TransactionCredit} />
      </div>
    </Router>
  </div>,
  document.getElementById('app'),
);
