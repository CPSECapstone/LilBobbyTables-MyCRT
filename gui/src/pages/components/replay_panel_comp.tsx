import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';

import * as moment from 'moment';

import { mycrt } from '../utils/mycrt-client';

export class ReplayPanel extends React.Component<any, any>  {
    public constructor(props: any) {
        super(props);
        this.handleMetricClick = this.handleMetricClick.bind(this);
        this.handleInfoClick = this.handleInfoClick.bind(this);
        this.timer = this.timer.bind(this);
        this.getDurationDiff = this.getDurationDiff.bind(this);
        this.state = {active: this.props.replay.status === ChildProgramStatus.RUNNING ||
                     this.props.replay.status === ChildProgramStatus.STARTING ||
                     this.props.replay.status === ChildProgramStatus.STARTED,
                     live: this.props.replay.status === ChildProgramStatus.RUNNING,
                     replay: this.props.replay, capture: this.props.capture,
                     done: this.props.replay.status === ChildProgramStatus.DONE,
                     scheduled: this.props.replay.status === ChildProgramStatus.SCHEDULED,
                     failed: this.props.replay.status === ChildProgramStatus.FAILED};
    }

    public async componentWillMount() {
       const replayDB = await mycrt.getReplayDB(this.props.replay.dbId);
       if (replayDB) {
          this.setState({db: replayDB.name});
       }
       const startCaptureTime = new Date(this.props.capture.start);
       const endCaptureTime = new Date(this.props.capture.end);
       const duration = endCaptureTime.getTime() - startCaptureTime.getTime();
       this.setState({totalDuration: duration});
       this.setState({currentDuration: this.getDurationDiff()});
    }

    public componentDidMount() {
      if (this.state.live) {
         const intervalId = setInterval(this.timer, 1000);
         // store intervalId in the state so it can be accessed later:
         this.setState({intervalId});
      }
   }

   public componentWillUnmount() {
      // use intervalId from the state to clear the interval
      clearInterval(this.state.intervalId);
   }

   public getDurationDiff() {
      const currentDateTime = new Date();
      const replayStartTime = new Date(this.state.replay.start);
      return currentDateTime.getTime() - replayStartTime.getTime();
   }

   public timer() {
      const currentDuration = this.getDurationDiff();
      if (currentDuration <= this.state.totalDuration) {
         this.setState({currentDuration});
      } else {
         const replay = this.state.replay;
         replay.status = ChildProgramStatus.STOPPING;
         this.setState({replay, live: false, active: false});
         clearInterval(this.state.intervalId);
      }
   }

    public handleMetricClick(event: any): void {
         window.location.assign(`/capture?id=${this.props.capture.id}&`
            + `replayId=${this.props.replay.id}envId=${this.props.envId}&view=metrics`);
    }

    public handleInfoClick(event: any): void {
      if (this.state.replay.status === ChildProgramStatus.DONE) {
         window.location.assign(`/capture?id=${this.props.capture.id}&`
         + `replayId=${this.props.replay.id}envId=${this.props.envId}&view=replays`);
      }
   }

   public handleCaptureClick(event: any): void {
      window.location.assign(`/capture?id=${this.props.capture.id}&envId=${this.props.envId}&view=details`);
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
                    <h5 className="hover-text" style={{display: "inline", verticalAlign: "middle"}}
                        onClick={ (e) => this.handleInfoClick(e)}>{this.props.title}</h5>
                     <p className="hover-text" style={{margin: 0}}
                        onClick={ (e) => this.handleCaptureClick(e)}><i>({this.state.capture.name})</i></p>
                    </div>
                    {this.state.done ? <button type="button" className="btn btn-success"
                                            onClick={ (e) => this.handleMetricClick(e)}
                                            style={{zIndex: 10, float: "right"}}>
                                            <i className="fa fa-line-chart"></i>  Compare</button> : null}
                </div>
                {this.state.live ?
                  <div className="progress" style={{height: "20px", borderRadius: 0}}>
                     <div className="progress-bar progress-bar-striped progress-bar-animated myCRT-progress-bar"
                        role="progressbar" aria-valuenow={this.state.currentDuration} aria-valuemin={0}
                        style={{width: percent}} aria-valuemax={this.state.totalDuration}>
                        {percent}</div>
                  </div> :
                  <div className={`card-footer ${statusStyle}`}>{this.state.replay.status}</div>}
                <div className="card-body">
                    <p><b>DB:</b><i> {this.state.db}</i></p>
                    <p><b>Start:</b><i> {this.formatTimeStamp(this.state.replay.start)}</i></p>
                    <p style={{margin: 0}}><b>End:</b><i> {this.formatTimeStamp(this.state.replay.end)}</i></p>
                </div>
            </div>
        );
    }
}
