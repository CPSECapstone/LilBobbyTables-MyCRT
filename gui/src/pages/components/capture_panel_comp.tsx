import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

import * as moment from 'moment';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';
import { mycrt } from '../utils/mycrt-client';

export class CapturePanel extends React.Component<any, any>  {

    public constructor(props: any) {
        super(props);
        this.handleInfoClick = this.handleInfoClick.bind(this);
        this.handleMetricClick = this.handleMetricClick.bind(this);
        this.stopCapture = this.stopCapture.bind(this);
        this.endTimer = this.endTimer.bind(this);
        this.getCurrDuration = this.getCurrDuration.bind(this);
        this.state = {active: this.props.capture.status === ChildProgramStatus.RUNNING ||
            this.props.capture.status === ChildProgramStatus.STARTING ||
            this.props.capture.status === ChildProgramStatus.STARTED,
            live: this.props.capture.status === ChildProgramStatus.RUNNING, capture: this.props.capture,
            scheduled: this.props.capture.status === ChildProgramStatus.SCHEDULED,
            done: this.props.capture.status === ChildProgramStatus.DONE,
            failed: this.props.capture.status === ChildProgramStatus.FAILED};
    }

    public handleInfoClick(event: any): void {
       if (this.state.capture.status === ChildProgramStatus.DONE) {
         window.location.assign(`/capture?id=${this.props.capture.id}&envId=${this.props.envId}&view=details`);
       }
    }

    public handleMetricClick(event: any): void {
      window.location.assign(`/capture?id=${this.props.capture.id}&envId=${this.props.envId}&view=metrics`);
    }

    public componentDidMount() {
      if (this.props.capture.scheduledEnd && this.state.live) {
         const startTime = new Date(this.props.capture.start);
         const endTime = new Date(this.props.capture.scheduledEnd);
         const duration = endTime.getTime() - startTime.getTime();
         this.setState({duration});
         this.setState({currentDuration: this.getCurrDuration()});
         const endIntervalId = setInterval(this.endTimer, 1000);
         this.setState({endIntervalId});
      }
   }

   public componentWillUnmount() {
      clearInterval(this.state.endIntervalId);
   }

   public getCurrDuration() {
      const startTime = new Date(this.state.capture.start);
      const currTime = new Date();
      return currTime.getTime() - startTime.getTime();
   }

   public endTimer() {
      const currentDuration = this.getCurrDuration();
      if (currentDuration < this.state.duration) {
         this.setState({ currentDuration });
      } else {
         const capture = this.state.capture;
         capture.status = ChildProgramStatus.STOPPING;
         this.setState({capture, live: false, active: false});
         clearInterval(this.state.endIntervalId);
      }
   }

    public async stopCapture(event: any) {
      const capture = this.state.capture;
      capture.status = ChildProgramStatus.STOPPING;
      capture.end = new Date();
      this.setState({ capture, active: false, live: false });
      let result = await mycrt.stopCapture(this.state.capture.id);
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
       const percent = `${((this.state.currentDuration / this.state.duration) * 100).toFixed(0)}%`;
        return (
            <div className="card myCRT-panel mt-4 ml-4 mr-4 myCRT-card">
                <div className={`card-header ${className}`}>
                    <h5 className="hover-text" style={{display: "inline", verticalAlign: "middle", cursor: "pointer"}}
                        onClick={ (e) => this.handleInfoClick(e)}>{this.props.title}</h5>
                    {this.state.live && !this.state.capture.scheduledEnd ?
                        <button type="button" className="btn btn-danger"
                           style={{zIndex: 10, float: "right"}}
                           onClick={(e) => this.stopCapture(e)}>Stop</button> : null}
                    {this.state.done ? <button type="button"
                        className="btn btn-success" style={{zIndex: 10, float: "right"}}
                           onClick={ (e) => this.handleMetricClick(e)}>
                        <i className="fa fa-line-chart"></i>  View</button> : null}
                </div>
                {this.state.capture.scheduledEnd && this.state.live ?
                  <div className="progress" style={{height: "20px", borderRadius: 0}}>
                     <div className="progress-bar progress-bar-striped progress-bar-animated myCRT-progress-bar"
                        role="progressbar" aria-valuenow={this.state.currentDuration} aria-valuemin={0}
                        style={{width: percent}} aria-valuemax={this.state.duration}>
                        {percent}</div>
                  </div> :
                  <div className={`card-footer ${statusStyle}`}>{this.state.capture.status}</div>}
                <div className="card-body">
                  {this.state.failed ? <p className="myCRT-danger-label"><i>{this.state.capture.reason}</i></p> : null}
                  {this.state.scheduled ?
                     <p><b>Scheduled Start:</b><i> {this.formatTimeStamp(this.state.capture.scheduledStart)}</i></p> :
                     <p><b>Start:</b><i> {this.formatTimeStamp(this.state.capture.start)}</i></p>}
                  {this.state.capture.scheduledEnd && !this.state.done ?
                     <p><b>Scheduled Stop:</b><i> {this.formatTimeStamp(this.state.capture.scheduledEnd)}</i></p> :
                     <p><b>Stop:</b><i> {this.formatTimeStamp(this.state.capture.end)}</i></p>}
                </div>
            </div>
        );
    }
}
