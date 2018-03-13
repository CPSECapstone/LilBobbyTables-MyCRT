import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import * as moment from 'moment';

import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';
import { WarningAlert } from './alert_warning_comp';
import { Duration } from './duration_comp';
import { StartDateTime } from './start_date_time_comp';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';

export class CaptureModal extends React.Component<any, any>  {

   private baseState = {} as any;

   constructor(props: any) {
      super(props);
      this.handleClick = this.handleClick.bind(this);
      this.cancelModal = this.cancelModal.bind(this);
      this.state = { captureName: "", scheduledStart: "", captureType: "immediately",
         automaticStop: false, endDuration: {days: 1, hours: 1, minutes: 1}};
      this.handleTimeChange = this.handleTimeChange.bind(this);
      this.handleEndTypeChange = this.handleEndTypeChange.bind(this);
      this.handleCaptureTypeChange = this.handleCaptureTypeChange.bind(this);
      this.handleDayChange = this.handleDayChange.bind(this);
      this.handleHourChange = this.handleHourChange.bind(this);
      this.handleMinuteChange = this.handleMinuteChange.bind(this);
      this.baseState = this.state;
   }

   public allFieldsFilled() {
      return this.state.captureName !== ""; // will be extended later
   }

   public calculateDuration() {
      const daysInSecs = this.state.endDuration.days * 86400;
      const hoursInSecs = this.state.endDuration.hours * 3600;
      const minutesInSecs = this.state.endDuration.minutes * 60;
      logger.info(String(daysInSecs + hoursInSecs + minutesInSecs));
      return daysInSecs + hoursInSecs + minutesInSecs;
   }

   public async handleClick(event: any) {
      if (!this.allFieldsFilled()) {
         logger.error("Please fill in all fields");
         $('#captureWarning').show();
         return;
      }
      const capture = {name: this.state.captureName, envId: this.props.envId} as any;
      if (this.state.captureType === "specific") {
         capture.status = ChildProgramStatus.SCHEDULED;
         capture.scheduledStart = this.state.scheduledStart;
      }
      if (this.state.automaticStop) {
         capture.duration = this.calculateDuration();
      }
      const captureObj = await mycrt.startCapture(capture);
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

   public handleTimeChange(date: string) {
      const newDate = new Date(date);
      this.setState({scheduledStart: newDate});
   }

   public handleCaptureTypeChange(type: string) {
      this.setState({captureType: type});
   }

   public handleDayChange(days: number) {
      this.setState((prevState: any) => ({
         endDuration: { ...prevState.endDuration, days},
      }));
   }

    public handleHourChange(hours: number) {
      this.setState((prevState: any) => ({
         endDuration: { ...prevState.endDuration, hours},
      }));
    }

    public handleMinuteChange(minutes: number) {
      this.setState((prevState: any) => ({
         endDuration: { ...prevState.endDuration, minutes},
      }));
    }

    public handleNameChange(event: any) {
        this.setState({captureName: event.target.value});
    }

    public handleEndTypeChange(event: any) {
      this.setState({
         automaticStop: event.currentTarget.value === "specific",
     });
    }

    public cancelModal(event: any) {
        this.setState(this.baseState);
        this.render();
    }

    public render() {
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h4 className="modal-title">New Capture</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"
                                onClick={this.cancelModal}>
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <WarningAlert id="captureWarning" msg="Please fill in all the provided fields."
                                      style = {{display: "none"}}/>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <div className="card card-body bg-light">
                                        <label><b>Capture Name</b></label>
                                        <input type="name" className="form-control" id="captureName"
                                                value={this.state.captureName}
                                                onChange={this.handleNameChange.bind(this)}
                                                aria-describedby="captureName" placeholder="Enter name"></input>
                                        <small id="captureName" className="form-text text-muted"></small>
                                        <br/>
                                        <StartDateTime updateTime={this.handleTimeChange}
                                          updateType={this.handleCaptureTypeChange}/>
                                       <br/>
                                       <label><b>Stop Options</b></label>
                                       <div className="form-check">
                                          <label className="form-check-label" style={{padding: "5px"}}>
                                             <input type="radio" className="form-check-input" name="end options"
                                                onChange={this.handleEndTypeChange}
                                                defaultValue="manual" defaultChecked/>
                                                Manual
                                          </label>
                                       </div>
                                       <div className="form-check">
                                          <label className="form-check-label" style={{padding: "5px"}}>
                                             <input type="radio" className="form-check-input" name="end options"
                                                onChange={this.handleEndTypeChange} defaultValue="specific"/>
                                                Automatic
                                          </label>
                                          <div className={this.state.automaticStop ? '' : 'hidden'}>
                                             <div className="container">
                                                <div className="row" >
                                                   <Duration type="days" update={this.handleDayChange}/>
                                                   <Duration type="hours" update={this.handleHourChange}/>
                                                   <Duration type="minutes" update={this.handleMinuteChange}/>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelBtn"
                                data-dismiss="modal" onClick={this.cancelModal}>Cancel</button>
                            <button type="button" className="btn btn-info"
                                    onClick = { (e) => this.handleClick(e) }>Save Capture</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
