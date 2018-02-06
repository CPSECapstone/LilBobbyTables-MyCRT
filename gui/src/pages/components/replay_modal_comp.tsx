import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class ReplayModal extends React.Component<any, any>  {

    constructor(props: any) {
        super(props);
        this.state = { replayName: "", captureId: "" };
    }

    public allFieldsFilled() {
        return this.state.replayName !== "" && this.state.captureId !== "";
    }

    public async handleClick(event: any) {
        if (!this.allFieldsFilled()) {
            logger.error("Please fill in all fields");
            $('#replayWarning').show();
            return;
        }
        const replayObj = await mycrt.startReplay({type: ChildProgramType.REPLAY,
            captureId: this.state.captureId, name: this.state.replayName });
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

    public handleNameChange(event: any) {
        this.setState({replayName: event.target.value});
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
                            <h5 className="modal-title">New Replay</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <WarningAlert id="replayWarning" msg="Please fill in all the provided fields."
                                      style = {{display: "none"}}/>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label><b>Replay Name</b></label>
                                    <input type="name" className="form-control" id="replayName"
                                    value={this.state.replayName} onChange={this.handleNameChange.bind(this)}
                                    aria-describedby="replayName" placeholder="Enter name"></input>
                                        <small id="replayName" className="form-text text-muted"></small>
                                </div>
                                {<select className="form-control" onChange={this.handleCaptureId.bind(this)}>
                                    <option>Select Capture...</option>
                                    {captures}
                                </select>}
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
