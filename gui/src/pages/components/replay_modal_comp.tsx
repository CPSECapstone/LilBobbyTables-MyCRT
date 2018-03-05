import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType, IReplayFull } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class ReplayModal extends React.Component<any, any>  {

    constructor(props: any) {
        super(props);
        this.state = { name: "", captureId: "", host: "", parameterGroup: "",
                       user: "", pass: "", instance: "", dbName: "", type: ChildProgramType.REPLAY,
                       envId: this.props.envId };
    }

    public allFieldsFilled() {
        for (const key in this.state) {
            if (!this.state[key]) {
                return false;
            }
        }
        return true;
    }

    public async handleClick(event: any) {
        if (!this.allFieldsFilled()) {
            logger.error("Please fill in all fields");
            $('#replayWarning').show();
            return;
        }
        const replayObj = await mycrt.startReplay(this.state as IReplayFull);
        if (!replayObj) {
            logger.error("Could not start replay");
        } else {
            const cancelBtn = document.getElementById("cancelReplayBtn");
            this.props.update();
            if (cancelBtn) {
                cancelBtn.click();
            }
        }
    }

    public handleInputChange(event: any) {
        this.setState({[event.target.id]: event.target.value});
    }

    public handleCaptureId(event: any) {
        const index = event.target.selectedIndex;
        const optionElement = event.target.childNodes[index];
        const captureId =  optionElement.getAttribute('id');
        logger.info(captureId);
        this.setState({captureId});
    }

    public render() {
        const captures: JSX.Element[] = [];
        if (this.props.captures) {
           for (const capture of this.props.captures) {
              let name = `${capture.name}`;
              if (!name) {
                  name = `capture ${capture.id}`;
              }
              captures.push((<option id={capture.id}>{name}</option>));
           }
        }
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h4 className="modal-title">New Replay</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <WarningAlert id="replayWarning" msg="Please fill in all the provided fields."
                                      style = {{display: "none"}}/>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <div className="card card-body bg-light">
                                        <label><b>Replay Name</b></label>
                                        <input type="name" className="form-control" id="name"
                                        value={this.state.name} onChange={this.handleInputChange.bind(this)}
                                        aria-describedby="replayName" placeholder="Enter name"></input>
                                            <small id="replayName" className="form-text text-muted"></small>
                                        <br/>
                                        <label><b>Capture</b></label>
                                        {<select className="form-control" onChange={this.handleCaptureId.bind(this)}>
                                            <option>Select Capture...</option>
                                            {captures}
                                        </select>}
                                        <br/>
                                        <label><b>DB Reference</b></label>
                                        <input className="form-control input-lg" placeholder="Enter DB Name"
                                            value={this.state.dbName} id="dbName"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Instance"
                                            value={this.state.instance} id="instance"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Parameter Group"
                                            value={this.state.parameterGroup} id="parameterGroup"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Host"
                                            value={this.state.host} id="host"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Username"
                                            value={this.state.user} id="user"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Password"
                                            value={this.state.pass} id="pass"
                                            onChange={this.handleInputChange.bind(this)}/>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelReplayBtn"
                                    data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-info"
                                    onClick={this.handleClick.bind(this)}>Save Replay</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
