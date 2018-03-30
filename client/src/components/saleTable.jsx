import React from 'react';
import ReactTable from 'react-table';
import socket from '../socket.js';

class SaleTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      itemsData: [],
      salesData: [],
      tableData: [],
    };
    this.generateTableData = this.generateTableData.bind(this);
    this.getItemNames = this.getItemNames.bind(this);
    this.initSocket = this.initSocket.bind(this);
  }

  componentDidMount() {
    this.initSocket();
  }

  componentWillReceiveProps(nextProps) {
    // console.log('nextProps.salesData', nextProps.salesData);
    // console.log('nextProps.itemsData', nextProps.itemsData);
    this.setState({
      itemsData: nextProps.itemsData,
      salesData: nextProps.salesData,
    }, () => {
      this.generateTableData(nextProps.salesData, nextProps.itemsData);
    });
  }

  getItemNames(items) {
    const itemsArray = JSON.parse(items);
    const itemsData = this.state.itemsData;
    const obj = {};
    var result = '';
    const itemnamesArray = itemsArray.map((item) => {
      for (var i = 0; i < itemsData.length; i++) {
        if (item === itemsData[i].id) {
          item = itemsData[i].item_name;
        }
      }
      return item;
    });
    itemnamesArray.forEach((item) => {
      if (obj[item] === undefined) {
        obj[item] = 1;
      } else {
        obj[item]++;
      }
    });
    for (var key in obj) {
      result += obj[key] + ' ' + key + ' '
    }
    return result;
  }

  generateTableData(salesData, itemsData) {
    const data = salesData.map((sale) => {
      const obj = {};
      obj.date = sale.sale_date;
      obj.items = this.getItemNames(sale.item_id);
      obj.amount = sale.sale_amount;
      obj.cost = sale.sale_cost;
      obj.discount = sale.sale_discount + '%';
      obj.type = sale.sale_cash ? 'Cash' : 'Credit';
      obj.employee = sale.employee_id;
      return obj;
    });
    this.setState({
      tableData: data,
    }, () => {
      console.log('this.state.tableData', this.state.tableData);
    });
  }

  initSocket() {
    socket.on('addSale', (data) => {
      console.log('socket data', data);
      const obj = {};
      obj.date = data.sale_date;
      obj.items = data.item_id;
      obj.amount = data.sale_amount;
      obj.cost = data.sale_cost;
      obj.discount = data.sale_discount + '%';
      obj.type = data.sale_cash ? 'Cash' : 'Credit';
      obj.employee = data.employee_id;
      const tempdata = this.state.tableData.slice();
      tempdata.push(obj);

      this.setState({
        tableData: tempdata,
      });
    });
  }

  render() {
    const columns = [
      {
        Header: 'Sale Date',
        accessor: 'date',
      },
      {
        Header: 'Items',
        accessor: 'items',
      },
      {
        Header: 'Sale Amount ($)',
        accessor: 'amount',
      },
      {
        Header: 'Sale Cost ($)',
        accessor: 'cost',
      },
      {
        Header: '% Sale Discount',
        accessor: 'discount',
      },
      {
        Header: 'Payment Type',
        accessor: 'type',
      },
      {
        Header: 'Employee',
        accessor: 'employee',
      },
    ];
    return (
      <div>
        <ReactTable
          data={this.state.tableData}
          columns={columns}
          defaultPageSize={10}
          style={{ color: 'black' }}
          sorted={[{
            id: 'date',
            desc: true,
          }]}
        />
      </div>
    );
  }
}

export default SaleTable;
