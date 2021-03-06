import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class DeleteModal extends React.Component<any, any>  {

   private baseState = {} as any;

   constructor(props: any) {
      super(props);
      this.state = { name: "", deleteLogs: true, disabled: true, nameValid: 'invalid'};
      this.handleClick = this.handleClick.bind(this);
      this.handleNameChange = this.handleNameChange.bind(this);
      this.handleCheckChange = this.handleCheckChange.bind(this);
      this.cancelModal = this.cancelModal.bind(this);
      this.baseState = this.state;
   }

    public async handleClick(event: any) {
        if (this.state.name !== this.props.name) {
            logger.error("Given capture name doesn't match.");
            return;
        }
        this.props.delete(this.props.deleteId, this.state.deleteLogs);
    }

    public handleNameChange(event: any) {
      if (event.target.value === this.props.name) {
         this.setState({name: event.target.value, nameValid: 'valid', disabled: false});
      } else {
         this.setState({name: event.target.value, nameValid: 'invalid', disabled: true});
      }
    }

    public handleCheckChange(event: any) {
        this.setState({deleteLogs: event.target.checked});
    }

    public cancelModal(event: any) {
      $("#check").click();
      this.setState(this.baseState);
      this.render();
  }

    public render() {
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-danger">
                            <h4 className="modal-title">Delete {this.props.name}</h4>
                            <button type="button" className="close" data-dismiss="modal"
                              onClick={this.cancelModal} aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <WarningAlert id="deleteWarning" msg="Please fill in all the provided fields."
                            style = {{display: "none"}}/>
                        <div className="modal-body">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
                                    <div className="card card-body bg-light">
                                        <label className="myCRT-danger-label"><b>
                                            <i>Warning: Deleting will also delete all associated data.
                                                This action cannot be undone.</i></b></label>
                                        <br/>
                                        <label><b>Type the {this.props.type} Name</b></label>
                                        <input type="name" id="deleteName"
                                        className={`form-control is-${this.state.nameValid}`}
                                        value={this.state.name} onChange={this.handleNameChange.bind(this)}
                                        aria-describedby="deleteName" placeholder="Enter name"></input>
                                       <small id="deleteName" className="form-text text-muted"></small>
                                       <div className={`${this.state.nameValid}-feedback`}>
                                          {this.state.nameValid === 'valid' ? "Looks good!" :
                                             `Please type the ${this.props.type} name exactly as written.`}</div>
                                        <br/>
                                        <div className="form-check">
                                            <label className="form-check-label">
                                            <input type="checkbox" className="form-check-input" id="check"
                                                onChange={(e) => this.handleCheckChange(e)}
                                                defaultChecked={this.state.deleteLogs}/>
                                            Delete All Workload and Metric Files
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelButton"
                                    data-dismiss="modal" onClick={this.cancelModal}>Cancel</button>
                            <button type="button" className="btn btn-danger"
                                    disabled={this.state.disabled}
                                    onClick={this.handleClick.bind(this)}>Delete {this.props.type}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
