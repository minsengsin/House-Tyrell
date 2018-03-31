import React from 'react';


export default class DeleteEmployeeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      'dummy': 'dummy'
    }
    this.deleteEmployee = this.deleteEmployee.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  deleteEmployee() {
    console.log('this is props', this.props)
  }

  closeModal(modal) {
    document.getElementById(modal).style.display = 'none';
  }

  render() {
    return (
        <div className="modal-content-deleteEmp">
          <div className="modal-header-deleteEmp">
            <div className="modal-title">Confirm Deletion</div>
            <div className="modal-close" onClick={() => this.props.closeModal('deleteEmpModal')}><i className="fas fa-times-circle"></i></div>
          </div>
          <div className="modal-body-deleteEmp">
            <h3>Please confirm that you want to delete this employee's data.</h3>
            <div className="confirmOrCancel">
              <div onClick={this.deleteEmployee} className="confirmConfirm">Delete</div>
              <div onClick={() => this.props.closeModal('deleteEmpModal')} className="cancelConfirm">Cancel</div>
            </div>
          </div>
          <div className="modal-footer-deleteEmp">Clicking confirm will delete this Employee's data</div>

      </div>
    )
  }
}
