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
            live: this.props.capture.status === ChildProgramStatus.RUNNING, capture: this.props.capture};
    }

    public handleClick(event: any): void {

        window.location.assign(`/capture?id=${this.props.capture.id}&envId=${this.props.envId}`);
    }

    public async stopCapture(event: any) {
        this.setState({ active: false, live: false });
        let result = await mycrt.stopCapture(this.state.capture.id);
        logger.info(`${result}`);
        if (!result) {
            result = `Capture ${this.state.capture.id}: Failed to get capture result.`;
        }
    }

    public formatTimeStamp(date: string) {
        if (!date) {
            return "Pending";
        }
        const time = new Date(date);
        return time.toLocaleString();
    }

    public render() {
        return (
            <div className="card myCRT-panel mt-3">
                <div className={this.state.active ? "card-header myCRT-panel-running" : "card-header"}>
                    <h5 style={{display: "inline", verticalAlign: "middle"}}>{this.props.title}</h5>
                    {this.state.live ? <button type="button" className="btn btn-danger"
                                               style={{zIndex: 10, float: "right"}}
                                               onClick={(e) => this.stopCapture(e)}>Stop</button> : null}
                </div>
                <div className="card-body" onClick={ (e) => this.handleClick(e)}>
                    <p><i><b>Start:</b> {this.formatTimeStamp(this.state.capture.start)}</i></p>
                    <p><i><b>End:</b> {this.formatTimeStamp(this.state.capture.end)}</i></p>
                </div>
            </div>
        );
    }
}
