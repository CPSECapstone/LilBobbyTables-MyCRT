import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class LeaveModal extends React.Component<any, any>  {

   private baseState = {} as any;

   constructor(props: any) {
      super(props);
      this.leaveEnv = this.leaveEnv.bind(this);
      this.baseState = this.state;
   }

   public async leaveEnv(event: any) {
      this.props.leaveEnv();
   }

    public render() {
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-danger">
                            <h4 className="modal-title">Leave This Environment?</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
                                    <div className="card card-body bg-light">
                                        <label>Do you want to leave <b>{this.props.name}</b>?</label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelButton"
                                    data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-danger"
                                    onClick={this.leaveEnv}>Leave</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
