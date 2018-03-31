import React from 'react';
import Navigation from './managerNav.jsx';
import EmployeeBar from './employeeBar.jsx';
import Navbar from './navbar.jsx';
import Select from 'react-select';
import axios from 'axios';
import DeleteEmployeeModal from './deleteEmployeeModal.jsx'
import ReactTable from 'react-table';

const columns =
[
  {
    Header: 'Date and Time',
    columns: [
      {
        Header: 'Clock In',
        accessor: 'clockIn',
      },
      {
        Header: 'Clock Out',
        accessor: 'clockOut',
      },
    ],
  },
  {
    Header: 'Total Worked',
    columns: [
      {
        Header: 'Minutes',
        accessor: 'minutes',
      },
    ],
  },
];

class EmployeeInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      employeeSelectOptions: [],
      employeeName: '',
      employeeImage: '',
      employeeId: '',
      newEmployeeId: '',
      newEmployeeName: '',
      managerLevel: false,
      timeSheet: [],
    };
    this.getEmployeeList = this.getEmployeeList.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.generateEmployeeId = this.generateEmployeeId.bind(this);
    this.submitEmployee = this.submitEmployee.bind(this);
    this.generateTimesheet = this.generateTimesheet.bind(this);
    this.openModal = this.openModal.bind(this);

  }

  componentDidMount() {
    this.getEmployeeList();
  }

  getEmployeeList() {
    axios.get('/fetch/allEmployees')
      .then((results) => {
        const myOptions = [];
        for (let i = 0; i < results.data.length; i += 1) {
          myOptions.push({ value: results.data[i], label: results.data[i].employee_name });
        }
        this.setState({
          employeeSelectOptions: myOptions,
        });
      })
      .catch((error) => {
        throw error;
      });
  }

  handleChange(value) {
    this.setState({
      employeeName: value.value.employee_name,
      employeeImage: value.value.employee_img,
      employeeId: value.value.employee_id,
    }, () => this.generateTimesheet());
  }

  generateEmployeeId(e) {
    e.preventDefault();
    const num = Math.floor(Math.random() * 900000) + 100000;
    this.setState({
      newEmployeeId: num,
    });
  }

  generateTimesheet() {
    axios.get('/fetch/timeSheet', {
      params: {
        employeeId: this.state.employeeId,
      },
    })
      .then((results) => {
        this.setState({
          timeSheet: results.data,
        });
      })
      .catch((error) => {
        throw error;
      })
  }
  openModal(modal) {
    document.getElementById(modal).style.display = 'block';
  }



  submitEmployee() {
    axios.post('/newEmployee', {
      newEmployeeId: this.state.newEmployeeId,
      newEmployeeName: this.state.newEmployeeName,
      managerLevel: this.state.managerLevel,
    })
      .then(() => {
        this.setState({
          newEmployeeId: '',
          newEmployeeName: '',
        });
      })
      .catch((error) => {
        throw error;
      });
  }

  render() {
    let employeeImage, employeeDetails;
    if (this.state.employeeImage !== '') {
      employeeImage = <img src={this.state.employeeImage} />;
      employeeDetails =
      (<div className="profileGridDetails">
        <h2>Name: {this.state.employeeName}</h2>
        <h2>Employee Id: {this.state.employeeId}</h2>
        <h4>Hello</h4>
      </div>);
    }

    let tableData = [];
    if (this.state.timeSheet) {
      this.state.timeSheet.forEach((time) => {
        tableData.push({
          clockIn: time.check_in,
          clockOut: time.check_out,
          minutes: time.check_out !== null
            ?
            Math.floor((Math.floor(Date.parse(time.check_out) - Date.parse(time.check_in)) / 1000) / 60)
            :
            '',
        });
      });
    }
    return (
      <div>
        <div className="navbar">
          <Navbar />
        </div>
          <DeleteEmployeeModal
            id="deleteEmpModal"
            className="deleteEmpModal animated fadeIn"
            openModal={this.props.openModal}
            closeModal={this.props.closeModal}
            employeeName={this.state.employeeName}
            employeeId={this.state.employeeId}
          />
        <div className="managerScreenGrid">
          <div className="manager-navigation"><Navigation /></div>
          <div className="employeeGraphGrid">
            <div className="barChart"><EmployeeBar /></div>
          </div>
          <div className="profileGrid">
            <div className="profileGridImage">
              {employeeImage}
            </div>
            {employeeDetails}
          </div>
          <div className="employeeSelect">
            <Select
              className="discountDropdown"
              options={this.state.employeeSelectOptions}
              matchProp="any"
              searchable="true"
              onChange={value => this.handleChange(value)}
              placeholder="Select an Employee"
            /> <br />
            <form>
              <label className="newEmployeeNameLabel">Add New Employee:</label>
              <Select
                options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]}
                autosize={false}
                placeholder="Manager Level"
                onChange={value => this.setState({ managerLevel: value.value })}
              />
              <br />
              <label className="newEmployeeNameLabel">Enter Employee Name: </label>
              <input type="text" onChange={e => this.setState({ newEmployeeName: e.target.value })}/>
              <br /><br />
              <button onClick={e => this.generateEmployeeId(e)}>Generate Employee ID</button>
              <label className="employeeIdLabel">{this.state.newEmployeeId}</label>
              <br /><br />
              <button onClick={(e) => this.submitEmployee(e)}>Submit</button>
              <button onClick={() => this.openModal('delEmpModal')}>Delete Employee</button>
            </form>
          </div>
          <div>
            <ReactTable
              columns={columns}
              data={tableData}
              defaultPageSize={7}
              className="-striped -highlight"
              style={{ color: 'black' }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default EmployeeInfo;
