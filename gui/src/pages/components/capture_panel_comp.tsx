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
        this.state = {live: this.props.capture.status === ChildProgramStatus.LIVE ||
            this.props.capture.status === "queued", capture: this.props.capture};
        logger.info(this.props.capture.status);
    }

    public handleClick(event: any): void {

        window.location.assign(`./capture?id=${this.props.capture.id}`);
    }

    public async stopCapture(event: any) {
        this.setState({ live: false });
        let result = await mycrt.stopCapture(this.state.capture.id);
        logger.info(`${result}`);
        if (!result) {
            result = `Capture ${this.state.capture.id}: Failed to get capture result.`;
        }
    }

    public render() {
        return (
            <div className="card myCRT-panel mt-3">
                <div className={this.state.live ? "card-header myCRT-card-header" : "card-header"}>
                    <h5 style={{display: "inline", verticalAlign: "middle"}}>{this.props.title}</h5>
                    {this.state.live ? <button type="button" className="btn btn-danger"
                                               style={{zIndex: 10, float: "right"}}
                                               onClick={(e) => this.stopCapture(e)}>Stop</button> : null}
                </div>
                <div className="card-body" onClick={ (e) => this.handleClick(e)}>
                    <p> Information about {this.props.title} </p>
                </div>
            </div>
        );
    }
}
