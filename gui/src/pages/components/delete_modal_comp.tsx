import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class DeleteModal extends React.Component<any, any>  {

    constructor(props: any) {
        super(props);
        this.state = { name: "", deleteLogs: true };
    }

    public async handleClick(event: any) {
        if (this.state.name !== this.props.name) {
            logger.error("Given capture name doesn't match.");
            return;
        }
        await this.props.delete(this.props.deleteId, this.state.deleteLogs);
        this.props.update();
    }

    public handleNameChange(event: any) {
        this.setState({name: event.target.value});
    }

    public handleCheckChange(event: any) {
        logger.info(event.target.checked);
        this.setState({deleteLogs: event.target.checked});
    }

    public render() {
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-danger">
                            <h4 className="modal-title">Delete {this.props.name}</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <WarningAlert id="deleteWarning" msg="Please fill in all the provided fields."
                                      style = {{display: "none"}}/>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <div className="card card-body bg-light">
                                        <label className="myCRT-danger-label"><b>
                                            <i>Warning: Deleting will also delete all associated data.
                                                This action cannot be undone.</i></b></label>
                                        <br/>
                                        <label><b>Type the {this.props.type} Name</b></label>
                                        <input type="name" className="form-control" id="deleteName"
                                        value={this.state.name} onChange={this.handleNameChange.bind(this)}
                                        aria-describedby="deleteName" placeholder="Enter name"></input>
                                            <small id="deleteName" className="form-text text-muted"></small>
                                        <br/>
                                        <div className="form-check">
                                            <label className="form-check-label">
                                            <input type="checkbox" className="form-check-input"
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
                                    data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-danger"
                                    onClick={this.handleClick.bind(this)}>Delete {this.props.type}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
