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
   private startDateChild = {} as any;

   constructor(props: any) {
      super(props);
      this.handleClick = this.handleClick.bind(this);
      this.cancelModal = this.cancelModal.bind(this);
      this.state = { captureName: "", scheduledStart: moment().format("YYYY-MM-DDTHH:mm"),
         captureType: "immediately",  captureNameValid: 'invalid', reset: true,
         automaticStop: false, errorMsg: '', endDuration: {days: 0, hours: 0, minutes: 5},
         defaultDate: moment().format("YYYY-MM-DDTHH:mm")};
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
         this.setState({errorMsg: 'Please fill in all required fields.'});
         return;
      }
      const capture = {name: this.state.captureName, envId: this.props.envId} as any;
      if (this.state.captureType === "specific") {
         capture.status = ChildProgramStatus.SCHEDULED;
         capture.scheduledStart = this.state.scheduledStart;
         const startDate = new Date(this.state.scheduledStart);
         const currentDate = new Date();
         const duration = startDate.getTime() - currentDate.getTime();
         if (duration <= 0) {
            this.setState({errorMsg:  `You have chosen a date/time that has already
               passed. Please choose a different one.`});
            return;
         }
      }
      if (this.state.automaticStop) {
         capture.duration = this.calculateDuration();
         if (capture.duration <= 240) {
            this.setState({errorMsg: 'Captures can only be run for a duration of 5 minutes or greater.'});
            return;
         }
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
      this.setState({scheduledStart: newDate, errorMsg: ''});
   }

   public handleCaptureTypeChange(type: string) {
      this.setState({captureType: type, errorMsg: ''});
   }

   public handleDayChange(days: number) {
      this.setState((prevState: any) => ({
         errorMsg: '',
         endDuration: { ...prevState.endDuration, days},
      }));
   }

    public handleHourChange(hours: number) {
      this.setState((prevState: any) => ({
         errorMsg: '',
         endDuration: { ...prevState.endDuration, hours},
      }));
    }

    public handleMinuteChange(minutes: number) {
      this.setState((prevState: any) => ({
         errorMsg: '',
         endDuration: { ...prevState.endDuration, minutes},
      }));
    }

    public handleNameChange(event: any) {
      if (/^[a-zA-Z0-9 :_\-]{4,25}$/.test(event.target.value)) {
         this.setState({captureNameValid: 'valid'});
      } else {
         this.setState({captureNameValid: 'invalid'});
      }
      this.setState({captureName: event.target.value, errorMsg: ''});
    }

    public handleEndTypeChange(event: any) {
       logger.info(String(event.currentTarget.value === "specific"));
      this.setState({
         automaticStop: event.currentTarget.value === "specific",
         errorMsg: '',
     });
    }

    public cancelModal(event: any) {
      $("#manual").click();
      this.setState(this.baseState);
      this.startDateChild.resetChecks(this.state.scheduledStart);
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
                                        <input type="name" className={`form-control is-${this.state.captureNameValid}`}
                                                id="captureName"
                                                value={this.state.captureName}
                                                onChange={this.handleNameChange.bind(this)}
                                                aria-describedby="captureName" placeholder="Enter name"></input>
                                        <small id="captureName" className="form-text text-muted"></small>
                                        <div className={`${this.state.captureNameValid}-feedback`}>
                                          {this.state.captureNameValid === 'valid' ? "Looks good!" :
                                             `Please provide a name that is 4-25 characters long
                                             and contains only letters, numbers or spaces.`}</div>
                                        <br/>
                                        <StartDateTime updateTime={this.handleTimeChange}
                                          ref={(instance) => { this.startDateChild = instance; }}
                                          default={this.state.defaultDate} reset={this.state.reset}
                                          updateType={this.handleCaptureTypeChange}/>
                                       <br/>
                                       <label><b>Stop Options</b></label>
                                       <div className="form-check">
                                          <label className="form-check-label" style={{padding: "5px"}}>
                                             <input type="radio" className="form-check-input" name="end options"
                                                onChange={this.handleEndTypeChange} id="manual"
                                                defaultValue="manual" defaultChecked/>
                                                Manual
                                          </label>
                                       </div>
                                       <div className="form-check">
                                          <label className="form-check-label" style={{padding: "5px"}}>
                                             <input type="radio" className="form-check-input" name="end options"
                                                id="specific"
                                                onChange={this.handleEndTypeChange} defaultValue="specific"/>
                                                Automatic
                                          </label>
                                          <div className={this.state.automaticStop ? '' : 'hidden'}>
                                             <div className="container">
                                                <div className="row" >
                                                   <Duration type="days"
                                                      value={this.state.endDuration.days}
                                                      update={this.handleDayChange}/>
                                                   <Duration type="hours"
                                                      value={this.state.endDuration.hours}
                                                      update={this.handleHourChange}/>
                                                   <Duration type="minutes" update={this.handleMinuteChange}
                                                      value={this.state.endDuration.minutes}/>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                       <br></br>
                                       <div className="text-danger">
                                          {this.state.errorMsg}
                                       </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelBtn"
                                data-dismiss="modal" onClick={this.cancelModal}>Cancel</button>
                            <button type="button" className="btn btn-info"
                                 disabled={this.state.captureNameValid === 'valid' ? false : true}
                                 onClick = { (e) => this.handleClick(e) }>Save Capture</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
