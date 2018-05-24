import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import * as moment from 'moment';

import { showAlert } from '../../actions';
import { BrowserLogger as logger } from '../../logging';
import { store } from '../../store';
import { mycrt } from '../utils/mycrt-client';
import { WarningAlert } from './alert_warning_comp';
import { DBInfo } from './db_info_comp';
import { Duration } from './duration_comp';
import { StartDateTime } from './start_date_time_comp';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';
import { IChildProgram } from '../../../../common/dist/main';

export class CaptureModal extends React.Component<any, any>  {

   private baseState = {} as any;
   private startDateChild = {} as any;
   private dbInfoChild = {} as any;

   constructor(props: any) {
      super(props);
      this.handleClick = this.handleClick.bind(this);
      this.cancelModal = this.cancelModal.bind(this);
      this.state = { captureName: "", scheduledStart: moment().format("YYYY-MM-DDTHH:mm"),
         captureType: "immediately",  captureNameValid: 'invalid', reset: true, btnText: "Create",
         automaticStop: false, errorMsg: '', endDuration: {days: 0, hours: 0, minutes: 5}, replays: [],
         defaultDate: moment().format("YYYY-MM-DDTHH:mm"), concurrent: false, dbRefs: [], step: 1,
         currentReplay: {}, mimicNameValid: "invalid", mimicName: "", disabled: true, mimicLimit: 4};
      this.handleTimeChange = this.handleTimeChange.bind(this);
      this.validateCapture = this.validateCapture.bind(this);
      this.startCapture = this.startCapture.bind(this);
      this.addAnotherReplay = this.addAnotherReplay.bind(this);
      this.handlePasswordChange = this.handlePasswordChange.bind(this);
      this.handleDBName = this.handleDBName.bind(this);
      this.validateMimic = this.validateMimic.bind(this);
      this.startConcurrent = this.startConcurrent.bind(this);
      this.handleEndTypeChange = this.handleEndTypeChange.bind(this);
      this.handleCaptureTypeChange = this.handleCaptureTypeChange.bind(this);
      this.handleConcurrentChange = this.handleConcurrentChange.bind(this);
      this.handleDayChange = this.handleDayChange.bind(this);
      this.changeProgress = this.changeProgress.bind(this);
      this.handleHourChange = this.handleHourChange.bind(this);
      this.handleMinuteChange = this.handleMinuteChange.bind(this);
      this.sendSuccessMsg = this.sendSuccessMsg.bind(this);
      this.baseState = this.state;
   }

   public async componentWillMount() {
      const dbRefs = await mycrt.getEnvironmentDbs(this.props.envId);
      if (dbRefs) {
         const filterRefs = dbRefs.filter((db) => {
         return db.name !== this.props.sourceDB;
      });
      this.setState({dbRefs: filterRefs});
      this.baseState.dbRefs = filterRefs;
      }
   }

   public changeProgress(step: number) {
      this.setState({step, btnText: "Create", disabled: true});
      $('#captureWizard a[href="#captureStep' + step + '"]').tab('show');
   }

   public sendSuccessMsg(captureObj: any) {
      let msg = `${captureObj.name} is now running!`;
      if (captureObj.scheduledStart) {
         msg = `${captureObj.name} has been scheduled!`;
      }
      store.dispatch(showAlert({
         show: true,
         header: "Success!",
         success: true,
         message: msg,
      }));
   }

   public handleConcurrentChange(event: any) {
      const concurrent = event.target.checked;
      let btnText = "Create";
      if (concurrent) {
         btnText = "Continue";
      }
      this.setState({concurrent, btnText});
   }

   public handleMimicName(event: any) {
      const name = event.target.value;
      if (/^[a-zA-Z0-9 :_-]{4,25}$/.test(event.target.value)) {
         this.setState({mimicNameValid: 'valid', disabled: false,
            mimicName: name, errorMsg: ""});
      } else {
         this.setState({mimicNameValid: 'invalid', disabled: true,
            mimicName: name, errorMsg: ""});
      }
   }

   public handlePasswordChange(pass: string) {
      const currentReplay = this.state.currentReplay;
      currentReplay.pass = pass;
      this.setState({currentReplay, errorMsg: ""});
   }

   public handleDBName(dbRef: any) {
      if (dbRef === "default") {
         this.setState({currentReplay: {}, errorMsg: "", disabled: true});
      } else {
         this.setState({currentReplay: dbRef, errorMsg: "", disabled: false});
      }
   }

   public calculateDuration() {
      const daysInSecs = this.state.endDuration.days * 86400;
      const hoursInSecs = this.state.endDuration.hours * 3600;
      const minutesInSecs = this.state.endDuration.minutes * 60;
      return daysInSecs + hoursInSecs + minutesInSecs;
   }

   public async handleClick(event: any) {
      if (this.state.step === 1) {
         this.validateCapture();
      } else {
         await this.validateMimic();
         if (this.state.errorMsg === "") {
            this.startConcurrent();
         }
      }
   }

   public async validateMimic() {
      const duplicateNames = this.state.replays.filter((replay: any) => replay.name === this.state.mimicName);
      if (duplicateNames.length > 0) {
         this.setState({errorMsg: "This replay name already exists within this capture. Please use a different one."});
         return;
      }
      const currentDB = this.state.currentReplay;
      const validate = await mycrt.validateDatabase(currentDB);
      if (validate) {
         currentDB.name = this.state.mimicName;
         const dbRefs = this.state.dbRefs.filter((dbRef: any) => dbRef.name !== currentDB.dbName);
         const replays = this.state.replays;
         replays.push(currentDB);
         this.setState({replays, currentReplay: {}, mimicName: "", mimicNameValid: "invalid", dbRefs});
      } else {
         this.setState({errorMsg: 'Password was invalid. Please try again.'});
      }
   }

   public async addAnotherReplay() {
      await this.validateMimic();
      if (this.state.errorMsg === "") {
         this.setState({step: this.state.step + 1, disabled: true, errorMsg: ""});
         this.dbInfoChild.reset();
      }
   }

   public async validateCapture() {
      const duplicateName = await mycrt.validateCaptureName(this.state.captureName, this.props.envId);
      if (duplicateName) {
         this.setState({errorMsg: `This capture name already exists within this environment.
            Please use a different one.`});
         return;
      }

      const bucketExists = await mycrt.validateStorage(this.props.envId);
      if (!bucketExists) {
         this.setState({errorMsg: `The bucket associated with this environment does not exist.
            Please create a bucket in S3 named ${this.props.bucket}.`});
         return;
      }

      const capture = {name: this.state.captureName, envId: this.props.envId} as any;
      if (this.state.captureType === "specific") {
         capture.status = ChildProgramStatus.SCHEDULED;
         capture.scheduledStart = this.state.scheduledStart;
         const startDate = new Date(this.state.scheduledStart);
         if (String(startDate) === "Invalid Date") {
            this.setState({errorMsg: 'Please enter a valid date and time.'});
            return;
         }
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
         if (!capture.duration) {
            this.setState({errorMsg: 'Capture durations must be a number.'});
            return;
         }
         if (capture.duration <= 240 || capture.duration > 86400) {
            this.setState({errorMsg: 'Captures can only be run for a duration of 5 minutes to 1 day.'});
            return;
         }
      }
      if (this.state.concurrent) {
         this.changeProgress(2);
      } else {
         this.startCapture(capture);
      }
    }

   public async startCapture(capture: IChildProgram) {
      const captureObj = await mycrt.startCapture(capture);
      if (!captureObj) {
         this.setState({errorMsg: "There was an error: Capture was not started."});
      } else {
         const cancelBtn = document.getElementById("cancelCapture");
         this.props.update();
         if (cancelBtn) {
            cancelBtn.click();
         }
         this.sendSuccessMsg(capture);
      }
   }

   public async startConcurrent() {
      const capture = {name: this.state.captureName, envId: this.props.envId} as any;
      if (this.state.captureType === "specific") {
         capture.status = ChildProgramStatus.SCHEDULED;
         capture.scheduledStart = this.state.scheduledStart;
      }
      if (this.state.automaticStop) {
         capture.duration = this.calculateDuration();
      }
      const concurrent = await mycrt.startMimic(capture, this.state.replays);
      if (!concurrent) {
         this.setState({errorMsg: "There was an error: Capture and replays were not started"});
      } else {
         const cancelBtn = document.getElementById("closeMimic");
         this.props.update();
         if (cancelBtn) {
            cancelBtn.click();
         }
         this.sendSuccessMsg(capture);
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
      if (/^[a-zA-Z0-9 :_-]{4,25}$/.test(event.target.value)) {
         this.setState({captureNameValid: 'valid', disabled: false});
      } else {
         this.setState({captureNameValid: 'invalid', disabled: true});
      }
      this.setState({captureName: event.target.value, errorMsg: ''});
    }

    public handleEndTypeChange(event: any) {
      this.setState({
         automaticStop: event.currentTarget.value === "specific",
         errorMsg: '',
     });
    }

    public cancelModal(event: any) {
      $("#manual").click();
      this.setState(this.baseState);
      this.startDateChild.resetChecks(this.state.scheduledStart);
      this.dbInfoChild.reset();
      $('#concurrentCheck').prop("checked", false);
      $('#captureWizard a[href="#captureStep1"]').tab('show');
      this.render();
    }

    public render() {
        return (
            <div className="modal fade" id={this.props.id} role="dialog"
                aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h4 className="modal-title">New Capture</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"
                                id="closeMimic" onClick={this.cancelModal}>
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" id="captureWizard">
                           <div className="navbar myCRT-env-navbar" style={{display: "none"}}>
                              <div className="navbar-inner">
                                 <ul className="nav nav-pills">
                                    <li className= "nav-item"><a className= "nav-link active"
                                       href="#captureStep1" data-toggle="tab" data-step="1">Step 1</a></li>
                                    <li className= "nav-item"><a className="nav-link"
                                       href="#captureStep2" data-toggle="tab" data-step="2">Step 2</a></li>
                                 </ul>
                              </div>
                           </div>
                           <br />
                           <div className="tab-content">
                              <div className="tab-pane myCRT-tab-pane fade show active" id="captureStep1">
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
                                          `Please provide a name with 4-25 alphanumeric characters.
                                          The following characters are also allowed: -_:`}</div>
                                    <br/>
                                    <StartDateTime updateTime={this.handleTimeChange}
                                       ref={(instance) => { this.startDateChild = instance; }}
                                       default={this.state.defaultDate} reset={this.state.reset}
                                       now="captureNow" scheduled="captureScheduled" id="captureStartDate"
                                       updateType={this.handleCaptureTypeChange} name="capture start options"/>
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
                                    </div><br></br>
                                    <div className="form-check">
                                       <label className="form-check-label">
                                       <input type="checkbox" className="form-check-input" id="concurrentCheck"
                                          onChange={this.handleConcurrentChange}
                                          defaultChecked={this.state.concurrent}/>
                                          Would you like to run a replay(s) simultaneously?
                                       </label>
                                    </div>
                                    <br></br>
                                    <div className="text-danger">
                                       {this.state.errorMsg}
                                    </div>
                                 </div>
                              </div>
                              <div className="tab-pane myCRT-tab-pane fade" id="captureStep2">
                                 <div className="card card-body bg-light">
                                    <h5 style={{paddingBottom: "10px"}}>Replay {this.state.step - 1}</h5>
                                    <label><b>Replay Name</b></label>
                                    <input type="name" className={`form-control is-${this.state.mimicNameValid}`}
                                       id="mimicReplayName" value={this.state.mimicName}
                                       onChange={this.handleMimicName.bind(this)}
                                       aria-describedby="mimicReplayName" placeholder="Enter name"></input>
                                       <small id="replayName" className="form-text text-muted"></small>
                                    <div className={`${this.state.mimicNameValid}-feedback`}>
                                       {this.state.mimicNameValid === 'valid' ? "Looks good!" :
                                       `Please provide a name with 4-25 alphanumeric characters.
                                       The following characters are also allowed: -_:`}</div>
                                    <br/>
                                    <DBInfo dbRefs={this.state.dbRefs} handlePasswordChange={this.handlePasswordChange}
                                       ref={(instance) => { this.dbInfoChild = instance; }}
                                       handleDBName={this.handleDBName}/>
                                    <br></br>
                                    <div className="text-danger">
                                       {this.state.errorMsg}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="modal-footer">
                           {this.state.step === 1 ? <button type="button" className="btn btn-secondary"
                              data-dismiss="modal" onClick={this.cancelModal} id="cancelCapture">Cancel</button> : null}
                           {(this.state.replays.length < this.state.mimicLimit) && (this.state.step > 1) ?
                              <button type="button" className="btn btn-secondary" id="addAnotherReplayBtn"
                             disabled={this.state.disabled} onClick={this.addAnotherReplay}>Add Another</button> : null}
                           <button type="button" className="btn btn-info"
                              disabled={this.state.disabled}
                              onClick = { (e) => this.handleClick(e) }>{this.state.btnText}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
