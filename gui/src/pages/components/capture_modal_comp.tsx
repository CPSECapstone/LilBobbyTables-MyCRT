import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';
import { Duration } from './duration_comp';
import { StartDateTime } from './start_date_time_comp';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';

export class CaptureModal extends React.Component<any, any>  {

    constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.state = { captureName: "" };
    }

    public async handleClick(event: any) {
        logger.info(this.state.captureName);
        const captureObj = await mycrt.startCapture({ name: this.state.captureName });
        if (!captureObj) {
            logger.error("Could not start capture");
        } else {
            logger.info(`${captureObj.name} was made with id ${captureObj.id}`);
            const cancelBtn = document.getElementById("cancelBtn");
            this.props.update();
            if (cancelBtn) {
                cancelBtn.click();
            }
        }
    }

    public handleNameChange(event: any) {
        this.setState({captureName: event.target.value});
    }

    public render() {
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h5 className="modal-title">New Capture</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label><b>Capture Name</b></label>
                                    <input type="name" className="form-control" id="captureName"
                                           value={this.state.captureName} onChange={this.handleNameChange.bind(this)}
                                           aria-describedby="captureName" placeholder="Enter name"></input>
                                    <small id="captureName" className="form-text text-muted"></small>
                                    <br/>
                                    <StartDateTime />
                                    <br/>
                                    <label><b>Duration</b></label>
                                    <div className="container">
                                        <div className="row">
                                            <Duration type="days" />
                                            <Duration type="hours" />
                                            <Duration type="minutes" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelBtn"
                                data-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-info"
                                    onClick = { (e) => this.handleClick(e) }>Save Capture</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
