import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';
import { mycrt } from '../utils/mycrt-client';

export class CapturePanel extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.stopCapture = this.stopCapture.bind(this);
        this.state = {active: this.props.capture.status === ChildProgramStatus.RUNNING ||
            this.props.capture.status === ChildProgramStatus.STARTING ||
            this.props.capture.status === ChildProgramStatus.STARTED,
            live: this.props.capture.status === ChildProgramStatus.RUNNING, capture: this.props.capture,
            scheduled: this.props.capture.status === ChildProgramStatus.SCHEDULED,
            failed: this.props.capture.status === ChildProgramStatus.FAILED};

         logger.info(this.state.capture.scheduledStart);
    }

    public handleClick(event: any): void {
        window.location.assign(`/capture?id=${this.props.capture.id}&envId=${this.props.envId}`);
    }

    public async stopCapture(event: any) {
        this.setState({ active: false, live: false });
        let result = await mycrt.stopCapture(this.state.capture.id);
        if (!result) {
            result = `Capture ${this.state.capture.id}: Failed to get capture result.`;
        }
        this.props.update(this.state.capture.id);
    }

    public formatTimeStamp(date: string) {
        if (!date) {
            return "Pending";
        }
        const time = new Date(date);
        return time.toLocaleString();
    }

    public render() {
       let className = "myCRT-env-card";
       let statusStyle = "myCRT-status-past";
       if (this.state.active) {
          className = "myCRT-panel-running";
          statusStyle = "myCRT-status-running";
       } else if (this.state.scheduled) {
          className = "myCRT-panel-scheduled";
          statusStyle = "myCRT-status-scheduled";
       } else if (this.state.failed) {
          className = "myCRT-panel-failed";
          statusStyle = "myCRT-status-failed";
       }
       if (!this.props.capture) { return (<div></div>); }
        return (
            <div className="card myCRT-panel mt-4 myCRT-card">
                <div className={`card-header ${className}`}>
                    <h5 style={{display: "inline", verticalAlign: "middle", cursor: "pointer"}}
                        onClick={ (e) => this.handleClick(e)}>{this.props.title}</h5>
                    {this.state.live ? <button type="button" className="btn btn-danger"
                                               style={{zIndex: 10, float: "right"}}
                                               onClick={(e) => this.stopCapture(e)}>Stop</button> : null}
                    {this.state.active || this.state.scheduled || this.state.failed ? null : <button type="button"
                        className="btn btn-success" style={{zIndex: 10, float: "right"}}
                           onClick={ (e) => this.handleClick(e)}>
                        <i className="fa fa-line-chart"></i>  View</button>}
                </div>
                <div className={`card-footer ${statusStyle}`}>
                  Status: {this.props.capture.status}
               </div>
                <div className="card-body">
                  {this.state.scheduled ?
                     <p><i><b>Scheduled Start:</b> {this.formatTimeStamp(this.state.capture.scheduledStart)}</i></p> :
                     <p><i><b>Start:</b> {this.formatTimeStamp(this.state.capture.start)}</i></p>}
                     <p><i><b>End:</b> {this.formatTimeStamp(this.state.capture.end)}</i></p>
                </div>
            </div>
        );
    }
}
