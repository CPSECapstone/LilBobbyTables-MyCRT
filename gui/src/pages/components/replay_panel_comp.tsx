import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';

import * as moment from 'moment';

import { mycrt } from '../utils/mycrt-client';

export class ReplayPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.timer = this.timer.bind(this);
        this.state = {active: this.props.replay.status === ChildProgramStatus.RUNNING ||
                     this.props.replay.status === ChildProgramStatus.STARTING ||
                     this.props.replay.status === ChildProgramStatus.STARTED,
                     live: this.props.replay.status === ChildProgramStatus.RUNNING, replay: this.props.replay,
                      totalDuration: 0, currentDuration: 0, capture: this.props.capture,
                     scheduled: this.props.replay.status === ChildProgramStatus.SCHEDULED,
                     failed: this.props.replay.status === ChildProgramStatus.FAILED};
    }

    public componentWillMount() {
       const startCaptureTime = new Date(this.state.capture.start);
       const endCaptureTime = new Date(this.state.capture.end);
       const duration = moment(endCaptureTime, "DD/MM/YYYY HH:mm:ss").diff(moment(
         startCaptureTime, "DD/MM/YYYY HH:mm:ss"));
       this.setState({totalDuration: duration});
       this.setState({currentDuration: this.getDurationDiff()});
    }

    public componentDidMount() {
      const intervalId = setInterval(this.timer, 1000);
      // store intervalId in the state so it can be accessed later:
      this.setState({intervalId});
   }

   public componentWillUnmount() {
      // use intervalId from the state to clear the interval
      clearInterval(this.state.intervalId);
   }

   public getDurationDiff() {
      const currentDateTime = new Date();
      // const replayStartTime = new Date(this.state.replay.start);
      const replayStartTime = new Date();
      let duration = moment(currentDateTime, "DD/MM/YYYY HH:mm:ss").diff(moment(
         replayStartTime, "DD/MM/YYYY HH:mm:ss"));
      if (duration >= this.state.totalDuration) {
         duration = this.state.totalDuration;
      }
      return duration;
   }

   public timer() {
      const duration = this.getDurationDiff();
      if (duration < this.state.totalDuration) {
         this.setState({ currentDuration: duration });
      } else {
         clearInterval(this.state.intervalId);
      }
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
      if (!this.props.replay) { return (<div></div>); }
        const percent = `${((this.state.currentDuration / this.state.totalDuration) * 100).toFixed(0)}%`;
        return (
            <div className="card myCRT-panel mt-4 myCRT-card">
                <div className={`card-header ${className}`}>
                    <div style={{display: "inline-block"}}>
                     <h5 style={{display: "inline", verticalAlign: "middle"}}>{this.props.title}</h5>
                     <p style={{margin: 0}}><i>({this.state.capture.name})</i></p>
                    </div>
                    {!this.state.live ? <button type="button" className="btn btn-success"
                                            onClick={ (e) => this.handleClick(e)}
                                            style={{zIndex: 10, float: "right"}}>
                                            <i className="fa fa-line-chart"></i>  Compare</button> : null}
                </div>
                <div className={`card-footer ${statusStyle}`}>
                  Status: {this.props.replay.status}
               </div>
                <div className="card-body">
                    <p><i><b>DB:</b> {this.state.replay.dbName}</i></p>
                    <p><i><b>Start:</b> {this.formatTimeStamp(this.state.replay.start)}</i></p>
                    <p style={{margin: 0}}><i><b>End:</b> {this.formatTimeStamp(this.state.replay.end)}</i></p>
                     <div className="progress" style={this.state.live ? {display: "block"} : {display: "none"}}>
                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                           role="progressbar" aria-valuenow={this.state.currentDuration}
                           style={{width: percent}} aria-valuemin={0} aria-valuemax={this.state.totalDuration}>
                           {percent}</div>
                     </div>
                </div>
            </div>
        );
    }
}
