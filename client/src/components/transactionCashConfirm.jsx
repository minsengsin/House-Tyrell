import React from 'react';
import axios from 'axios';
import { withRouter } from 'react-router';
import Navbar from './navbar.jsx';
import socket from '../socket.js';
import sendReceipt from '../../helpers/sendEmail.js';

class TransactionCashConfirm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: 'cash'
    };
    this.finalize = this.finalize.bind(this);
  }


  finalize(email) {
    if (email === 'email') {
      sendReceipt(this.props.location.state.transactionItems, this.props.location.state.total);
    }
    axios.post('/completed/transaction', {
      transactionItems: this.props.location.state.transactionItems,
      total: this.props.location.state.total,
      tendered: this.props.location.state.tendered,
      discount: this.props.location.state.discount,
      type: this.state.type
    }).then((results) => {
      socket.emit('madeSale',
      {
        id: results.data.id,
        total: results.data.sale_amount,
        item_id: results.data.item_id,
        sale_date: results.data.sale_date,
        tendered: this.props.location.state.tendered,
        sale_discount: results.data.sale_discount,
        type: this.state.type,
      });
      this.props.history.push('/salesScreen');
    })
  }

  render() {
    return (
      <div className="transactionCashConfirm animated fadeIn">
        <div>
          <div>
            <h1>Total Sale</h1>
            <h1><i className="fas fa-dollar-sign" /> {this.props.location.state.total}</h1>
            <h1>Tendered: </h1>
            <h1><i className="fas fa-dollar-sign" /> {this.props.location.state.tendered}</h1>
            <h1>Change: </h1>
            <h1><i className="fas fa-dollar-sign" /> {(this.props.location.state.tendered - this.props.location.state.total).toFixed(2)}</h1>
            <h1>Thank you for your purchase</h1>
            <div>
              <button type="button" onClick={() =>  this.finalize('email')}>Email Receipt</button>
              <button type="button" onClick={this.finalize}>Print Receipt</button>
              <button type="button" onClick={this.finalize}>No Receipt</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(TransactionCashConfirm);
