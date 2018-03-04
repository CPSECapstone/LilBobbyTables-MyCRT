import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

import { mycrt } from '../utils/mycrt-client';

export class ReplayPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.state = {live: this.props.replay.status === ChildProgramStatus.RUNNING, replay: this.props.replay};
    }

    public handleClick(event: any): void {
         window.location.assign(`/capture?id=${this.props.capture.id}&`
            + `replayId=${this.props.replay.id}envId=${this.props.envId}`);
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
            <div className="card myCRT-panel mt-4 myCRT-card">
                <div className={this.state.live ? "card-header myCRT-panel-running" : "myCRT-env-card card-header"}>
                    <h5 style={{display: "inline", verticalAlign: "middle"}}>{this.props.title}</h5>
                    <h6 style={{display: "inline", verticalAlign: "middle", float: "right"}}><i>
                    {this.props.capture ? this.props.capture.name + '  ' : ''}</i></h6>
                </div>
                <div className="card-body" onClick={ (e) => this.handleClick(e)}>
                    <p><i><b>Start:</b> {this.formatTimeStamp(this.state.replay.start)}</i></p>
                    <p><i><b>End:</b> {this.formatTimeStamp(this.state.replay.end)}</i></p>
                    {!this.state.live ? <button type="button" className="btn btn-success"
                                               style={{zIndex: 10, float: "right"}}>Compare</button> : null}
                </div>
            </div>
        );
    }
}
