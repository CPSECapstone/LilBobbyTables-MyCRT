import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

export class ReplayPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.state = {live: this.props.replay.status === ChildProgramStatus.RUNNING, replay: this.props.replay};
    }

    public handleClick(event: any): void {
        window.location.assign('./replay');
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
                <div className={this.state.live ? "card-header myCRT-panel-running" : "card-header"}>
                    <h5 style={{display: "inline", verticalAlign: "middle"}}>{this.props.title}</h5>
                    <h6 style={{display: "inline", verticalAlign: "middle"}}><i>
                    {this.props.capture ? ' (' + this.props.capture.name + ')' : ''}</i></h6>
                    {this.state.live ? <button type="button" className="btn btn-danger"
                                               style={{zIndex: 10, float: "right"}}>Stop</button> : null}
                </div>
                <div className="card-body" onClick={ (e) => this.handleClick(e)}>
                    <p><i><b>Start:</b> {this.formatTimeStamp(this.state.replay.start)}</i></p>
                    <p><i><b>End:</b> {this.formatTimeStamp(this.state.replay.end)}</i></p>
                </div>
            </div>
        );
    }
}
