import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import * as moment from 'moment';

import { ChildProgramStatus, ChildProgramType, IReplayFull } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { showAlert } from '../../actions/index';
import { store } from '../../store/index';
import { WarningAlert } from './alert_warning_comp';
import { StartDateTime } from './start_date_time_comp';

export class ReplayModal extends React.Component<any, any>  {

   private baseState = {} as any;
   private startDateChild = {} as any;

   constructor(props: any) {
      super(props);
      this.state = { name: "", captureId: "", host: "", parameterGroup: "",
                     user: "", pass: "", instance: "", dbName: "", type: ChildProgramType.REPLAY,
                     env: this.props.env, dbRefs: [], invalidDBPass: false, replayNameValid: 'invalid',
                     disabled: true, errorMsg: '', defaultDate: moment().format("YYYY-MM-DDTHH:mm"),
                     reset: true, scheduledStart: moment().format("YYYY-MM-DDTHH:mm"), replayType: "immediately",
                     buttonText: "Continue", modalPage: "1"};
      this.baseState = this.state;
      this.handleDBName = this.handleDBName.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
      this.handleTimeChange = this.handleTimeChange.bind(this);
      this.changeProgress = this.changeProgress.bind(this);
      this.validateName = this.validateName.bind(this);
      this.validateDB = this.validateDB.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleReplayTypeChange = this.handleReplayTypeChange.bind(this);
      this.cancelModal = this.cancelModal.bind(this);
      this.sendSuccessMsg = this.sendSuccessMsg.bind(this);
   }

   public async componentWillMount() {
      const iamRef = {accessKey: this.state.env.accessKey, secretKey: this.state.env.secretKey,
         region: this.state.env.region};
      const dbRefs = await mycrt.validateCredentials(iamRef);
      if (dbRefs) {
         const filterRefs = dbRefs.filter((db) => {
         return db.name !== this.state.env.dbName;
      });
      this.setState({dbRefs: filterRefs});
      this.baseState.dbRefs = filterRefs;
      }
   }

   public sendSuccessMsg(replayObj: any) {
      let msg = `${replayObj.name} is now running!`;
      if (replayObj.scheduledStart) {
         msg = `${replayObj.name} has been scheduled!`;
      }
      store.dispatch(showAlert({
         show: true,
         header: "Success!",
         success: true,
         message: msg,
      }));
   }

   public changeProgress(step: number) {
      let buttonText = 'Continue';
      if (step === 2) {
         buttonText = 'Validate & Start';
      }
      const percent = (step / 2) * 100;
      $('.progress-bar').css({width: percent + '%'});
      $('.progress-bar').text("Step " + step + " of 2");
      $('#replayWizard a[href="#replayStep' + step + '"]').tab('show');
      this.setState({modalPage: String(step), disabled: true, errorMsg: "", buttonText});
   }

   public handleClick(event: any) {
      const step = this.state.modalPage;
      if (step === '1') {
         this.validateName();
      } else if (step === '2') {
         this.validateDB(event.target.value);
      }
   }

   public async validateName() {
      const duplicateName = await mycrt.validateReplayName(this.state.name, this.state.captureId);
      if (duplicateName) {
         this.setState({errorMsg: 'This replay name already exists within this capture. Please use a different one.'});
         return;
      }
      if (this.state.replayType === "specific") {
         const startDate = new Date(this.state.scheduledStart);
         if (String(startDate) === "Invalid Date") {
            this.setState({errorMsg: 'Please enter a valid date and time.'});
            return;
         }
         const currentDate = new Date();
         const duration = startDate.getTime() - currentDate.getTime();
         if (duration <= 0) {
            this.setState({errorMsg: `You have chosen a date/time that has already
               passed. Please choose a different one.`});
            return;
         }
      }
      this.changeProgress(2);
   }

   public handleInputChange(event: any) {
      this.setState({[event.target.id]: event.target.value, errorMsg: ''});
   }

   public handleReplayTypeChange(type: string) {
      this.setState({replayType: type, errorMsg: ''});
   }

   public handleTimeChange(date: string) {
      const newDate = new Date(date);
      this.setState({scheduledStart: newDate, errorMsg: ''});
   }

   public handleNameChange(event: any) {
      const name = event.target.value;
      if (/^[a-zA-Z0-9 :_-]{4,25}$/.test(event.target.value)) {
         let disabled = true;
         if (this.state.captureId !== "") {
            disabled = false;
         }
         this.setState({replayNameValid: 'valid', disabled, name, errorMsg: ""});
      } else {
         this.setState({replayNameValid: 'invalid', disabled: true, name, errorMsg: ""});
      }
   }

   public async startReplay(replay: IReplayFull) {
      const replayObj = await mycrt.startReplay(replay);
      if (!replayObj) {
         this.setState({errorMsg: "There was an error: Replay was not started"});
      } else if ((replayObj as any).ok === false) {
         this.setState({
            errorMsg: (replayObj as any).message,
         });
      } else {
         const cancelBtn = document.getElementById("cancelReplayBtn");
         this.props.update();
         if (cancelBtn) {
            cancelBtn.click();
         }
         this.sendSuccessMsg(replay);
      }
   }

    public async validateDB(event: any) {
      const duplicateName = await mycrt.validateReplayName(this.state.name, this.state.captureId);
      if (duplicateName) {
         this.setState({errorMsg: 'This replay name already exists within this capture. Please use a different one.'});
         return;
      }

      const bucketExists = await mycrt.validateStorage(this.state.env.id);
      if (!bucketExists) {
         this.setState({errorMsg: `The bucket associated with this environment does not exist.
            Please create a bucket in S3 named ${this.state.env.bucket}.`});
         return;
      }

      const workloadFileExists = await mycrt.validateWorkloadFile(this.state.env.id, this.state.captureId);
      if (!workloadFileExists) {
         const capture = this.props.captures[this.state.captureId];
         this.setState({errorMsg: `Cannot run a replay on capture ${capture.name} because the `
                                 + `workload.json file associated with this capture does not exist in S3.`});
         return;
      }

      const replay = {name: this.state.name, captureId: this.state.captureId, type: this.state.type,
         host: this.state.host, parameterGroup: this.state.parameterGroup, user: this.state.user,
         pass: this.state.pass, instance: this.state.instance, dbName: this.state.dbName} as IReplayFull;
      if (this.state.replayType === "specific") {
         replay.status = ChildProgramStatus.SCHEDULED;
         replay.scheduledStart = this.state.scheduledStart;
      }
      const dbRef = {dbName: this.state.dbName, host: this.state.host,
         user: this.state.user, pass: this.state.pass};
      const validate = await mycrt.validateDatabase(dbRef);
      if (validate) {
         this.setState({errorMsg: ''});
         this.startReplay(replay);
      } else {
         this.setState({errorMsg: 'Password was invalid. Please try again.'});
      }
   }

   public handleCaptureId(event: any) {
      const target = event.currentTarget;
      if (target.value === "default") {
         this.setState({captureId: '', disabled: true, errorMsg: ''});
         return;
      }
      const index = event.target.selectedIndex;
      const optionElement = event.target.childNodes[index];
      const captureId =  optionElement.getAttribute('id');
      let disabled = true;
      if (this.state.replayNameValid === "valid") {
         disabled = false;
      }
      this.setState({captureId, disabled, errorMsg: ""});
   }

   public handleDBName(event: any) {
      const target = event.currentTarget;
      if (target.value === "default") {
         this.setState({dbName: '', disabled: true, errorMsg: ''});
         return;
      }
      const dbRef = JSON.parse(target.value);
      this.setState({dbName: dbRef.name, instance: dbRef.instance, parameterGroup: dbRef.parameterGroup,
      host: dbRef.host, user: dbRef.user, pass: "", errorMsg: '', disabled: false});
   }

   public cancelModal(event: any) {
        this.setState(this.baseState);
        $("select#captureDrop").val('default');
        $("select#dbDrop").val('default');
        this.startDateChild.resetChecks(this.state.scheduledStart);
        this.render();
        this.changeProgress(1);
   }

   public render() {
      const captures: JSX.Element[] = [];
      if (this.props.captures) {
         for (const id in this.props.captures) {
            const capture = this.props.captures[id];
            let name = `${capture.name}`;
            if (!name) {
               name = `capture ${capture.id}`;
            }
            if (capture.status === ChildProgramStatus.DONE) {
               captures.push((<option id={capture.id}>{name}</option>));
            }
         }
      }
      const databases: JSX.Element[] = [];
      if (this.state.dbRefs) {
         for (const db of this.state.dbRefs) {
            databases.push((<option value={JSON.stringify(db)}>{db.name}</option>));
         }
      }
      const state = this.state;
      return (
         <div className="modal fade" id={this.props.id} role="dialog"
            aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div className="modal-dialog">
               <div className="modal-content">
                  <div className="modal-header myCRT-modal-header">
                     <h4 className="modal-title">New Replay</h4>
                     <button type="button" className="close" data-dismiss="modal" aria-label="Close"
                        onClick={this.cancelModal}>
                        <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                     </button>
                  </div>
                  <div className="modal-body" id="replayWizard">
                     <div className="progress" style={{height: "20px", fontSize: "12px"}}>
                        <div className="progress-bar bg-success" role="progressbar" aria-valuenow={1}
                           aria-valuemin={1} aria-valuemax={3} style={{width: "50%"}}>
                           Step 1 of 2
                        </div>
                     </div>
                     <div className="navbar myCRT-env-navbar" style={{display: "none"}}>
                        <div className="navbar-inner">
                           <ul className="nav nav-pills">
                              <li className= "nav-item"><a className= "nav-link active"
                                 href="#replayStep1" data-toggle="tab" data-step="1">Step 1</a></li>
                              <li className= "nav-item"><a className="nav-link"
                                 href="#replayStep2" data-toggle="tab" data-step="2">Step 2</a></li>
                           </ul>
                        </div>
                     </div>
                     <br />
                     <div className="tab-content">
                        <div className="tab-pane myCRT-tab-pane fade show active" id="replayStep1">
                           <div className="card card-body bg-light">
                              <label><b>Replay Name</b></label>
                              <input type="name" className={`form-control is-${this.state.replayNameValid}`}
                                 id="name" value={this.state.name} onChange={this.handleNameChange.bind(this)}
                                 aria-describedby="replayName" placeholder="Enter name"></input>
                                 <small id="replayName" className="form-text text-muted"></small>
                              <div className={`${this.state.replayNameValid}-feedback`}>
                                 {this.state.replayNameValid === 'valid' ? "Looks good!" :
                                 `Please provide a name with 4-25 alphanumeric characters.
                                 The following characters are also allowed: -_:`}</div>
                              <br/>
                              <label><b>Capture</b></label>
                              {<select className="form-control" id="captureDrop"
                                 onChange={this.handleCaptureId.bind(this)}>
                                 <option value='default'>Select Capture...</option>
                                 {captures}
                              </select>}
                              <br/>
                              <StartDateTime updateTime={this.handleTimeChange}
                                 ref={(instance) => { this.startDateChild = instance; }}
                                 default={this.state.defaultDate} reset={this.state.reset}
                                 now="replayNow" scheduled="replayScheduled" id="replayStartDate"
                                 updateType={this.handleReplayTypeChange}/>
                              <br/>
                              <div className="text-danger">
                                 {this.state.errorMsg}
                              </div>
                           </div>
                        </div>
                        <div className="tab-pane myCRT-tab-pane fade" id="replayStep2">
                           <div className="card card-body bg-light">
                              <label><b>DB Reference</b></label>
                              {<select className="form-control input-lg" id="dbDrop"
                                 onChange={this.handleDBName.bind(this)}>
                                 <option value='default'>Select Database...</option>
                                 {databases}
                              </select>} <br/>
                              <div style={this.state.dbName ? {display: "block"} : {display: "none"}}>
                                 <dl>
                                    <dt><b>Instance:</b></dt>
                                    <dd>&nbsp;&nbsp;&nbsp;{this.state.instance}</dd>
                                 </dl>
                                 <dl>
                                    <dt><b>Host:</b></dt>
                                    <dd>&nbsp;&nbsp;&nbsp;{this.state.host}</dd>
                                 </dl>
                                 <dl>
                                    <dt><b>Parameter Group:</b></dt>
                                    <dd>&nbsp;&nbsp;&nbsp;{this.state.parameterGroup}</dd>
                                 </dl>
                                 <dl>
                                    <dt><b>Username:</b></dt>
                                    <dd>&nbsp;&nbsp;&nbsp;{this.state.user}</dd>
                                 </dl>
                                 <br/>
                                 <label><b>Password</b></label>
                                 <input className='form-control' id="pass" value={this.state.pass}
                                    placeholder="Enter Password" type="password"
                                    onChange={this.handleInputChange.bind(this)}/>
                              </div>
                              <br></br>
                              <div className="text-danger">
                                 {this.state.errorMsg}
                              </div>
                           </div>
                        </div>
                        <div className="modal-footer">
                           <button type="button" className="btn btn-secondary" id="cancelReplayBtn"
                              data-dismiss="modal" onClick={this.cancelModal}>Cancel</button>
                           <button type="button" className="btn btn-info"
                              disabled={this.state.disabled}
                              onClick={this.handleClick.bind(this)}>{this.state.buttonText}</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }
}
