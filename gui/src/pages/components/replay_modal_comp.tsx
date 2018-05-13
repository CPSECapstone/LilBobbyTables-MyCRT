import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';
import * as moment from 'moment';

import { ChildProgramStatus, ChildProgramType, IReplayFull } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

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
                       reset: true, scheduledStart: moment().format("YYYY-MM-DDTHH:mm"), replayType: "immediately"};
        this.baseState = this.state;
        this.handleDBName = this.handleDBName.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleTimeChange = this.handleTimeChange.bind(this);
        this.handleReplayTypeChange = this.handleReplayTypeChange.bind(this);
        this.cancelModal = this.cancelModal.bind(this);
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
      if (/^[a-zA-Z0-9 :_-]{4,25}$/.test(event.target.value)) {
         this.setState({replayNameValid: 'valid'});
         let disabled = true;
         if (this.state.dbName !== "" && this.state.captureId !== "") {
            disabled = false;
         }
         this.setState({replayNameValid: 'valid', disabled});
      } else {
         this.setState({replayNameValid: 'invalid', disabled: true});
      }
      this.setState({name: event.target.value, errorMsg: ''});
    }

   public async startReplay(replay: IReplayFull) {
      const replayObj = await mycrt.startReplay(replay);
      if (!replayObj) {
         this.setState({ errorMsg: "There was an error: Replay was not started" });
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
      }
   }

    public async validateDB(event: any) {
      const duplicateName = await mycrt.validateReplayName(this.state.name, this.state.captureId);
      if (duplicateName) {
         this.setState({errorMsg: 'This replay name already exists within this capture. Please use a different one.'});
         return;
      }
      const replay = {name: this.state.name, captureId: this.state.captureId, type: this.state.type,
         host: this.state.host, parameterGroup: this.state.parameterGroup, user: this.state.user,
         pass: this.state.pass, instance: this.state.instance, dbName: this.state.dbName} as IReplayFull;
      if (this.state.replayType === "specific") {
         replay.status = ChildProgramStatus.SCHEDULED;
         replay.scheduledStart = this.state.scheduledStart;
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
      const dbRef = {dbName: this.state.dbName, host: this.state.host,
         user: this.state.user, pass: this.state.pass};
      const validate = await mycrt.validateDatabase(dbRef);
      if (validate) {
         this.setState({errorMsg: ''});
         this.startReplay(replay);
      } else {
         this.setState({errorMsg: 'Password was invalid. Please try again.'});
         logger.error("Could not validate db");
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
      if (this.state.replayNameValid === "valid" && this.state.dbName !== "") {
         disabled = false;
      }
      this.setState({captureId, disabled});
    }

    public handleDBName(event: any) {
      const target = event.currentTarget;
      if (target.value === "default") {
         this.setState({dbName: '', disabled: true, errorMsg: ''});
         return;
      }
      let disabled = true;
      if (this.state.replayNameValid === "valid" && this.state.captureId !== "") {
         disabled = false;
      }
      const dbRef = JSON.parse(target.value);
      this.setState({dbName: dbRef.name, instance: dbRef.instance, parameterGroup: dbRef.parameterGroup,
      host: dbRef.host, user: dbRef.user, pass: "", errorMsg: '', disabled});
    }

    public cancelModal(event: any) {
        this.setState(this.baseState);
        $("select#captureDrop").val('default');
        $("select#dbDrop").val('default');
        this.startDateChild.resetChecks(this.state.scheduledStart);
        this.render();
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
                <div className="modal-dialog" role="document">
                    <div className="modal-content myCRT-modal">
                        <div className="modal-header myCRT-modal-header">
                            <h4 className="modal-title">New Replay</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"
                                onClick={this.cancelModal}>
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
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
                                        <div style={this.state.captureId ? {display: "block"} : {display: "none"}}>
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
                            <button type="button" className="btn btn-secondary" id="cancelReplayBtn"
                                    data-dismiss="modal" onClick={this.cancelModal}>Cancel</button>
                            <button type="button" className="btn btn-info"
                                    disabled={this.state.disabled}
                                    onClick={this.validateDB.bind(this)}>Validate & Start</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
