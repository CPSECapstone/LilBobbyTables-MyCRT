import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType, IAwsKeys, IEnvironmentFull } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { awsRegions } from '../utils/string-constants';
import { WarningAlert } from './alert_warning_comp';

export class EnvModal extends React.Component<any, any>  {

    private baseState = {} as any;

    constructor(props: any) {
        super(props);
        this.createEnvironment = this.createEnvironment.bind(this);
        this.validateCredentials = this.validateCredentials.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.handleInviteCode = this.handleInviteCode.bind(this);
        this.validateDB = this.validateDB.bind(this);
        this.validateName = this.validateName.bind(this);
        this.validateInviteCode = this.validateInviteCode.bind(this);
        this.handleEvent = this.handleEvent.bind(this);
        this.cancelModal = this.cancelModal.bind(this);
        this.changeProgress = this.changeProgress.bind(this);
        this.state = {envName: "", accessKey: "", secretKey: "", region: "", bucketList: [], envNameValid: 'invalid',
                      dbName: "", pass: "", bucket: "", prefix: "MyCRT", dbRefs: [], invalidDBPass: false,
                      modalPage: '1', envNameDuplicate: false, newEnv: true, inviteCode: "", errorMsg: "",
                      disabled: false, buttonText: 'Continue', credentialsValid: 'valid', dbCredentialsValid: 'valid',
                      sharedEnv: {}};
        this.baseState = this.state;
    }

    public handleOptionChange(event: any) {
      this.setState({
         newEnv: event.currentTarget.value === "newEnv",
      });
    }

    public changeProgress(step: number) {
      let buttonText = 'Continue';
      if (step === 3 || step === 4) {
         buttonText = 'Validate & Continue';
      }
      if (step === 5) {
         buttonText = 'Save';
      }
      if (step === 6) {
         buttonText = "Validate & Add";
      }
      const percent = ((step - 1) / 4) * 100;
      this.setState({modalPage: String(step), disabled: true, buttonText});
      $('.progress-bar').css({width: percent + '%'});
      $('.progress-bar').text("Step " + (step - 1) + " of 4");
      $('#envWizard a[href="#step' + step + '"]').tab('show');
   }

    public async validateName(event: any) {
      const result = await mycrt.validateEnvName(this.state.envName);
      if (result) {
         this.setState({envNameDuplicate: true});
      } else {
         this.changeProgress(3);
      }
    }

    public async validateCredentials(event: any) {
        const awsKeys = {accessKey: this.state.accessKey, secretKey: this.state.secretKey, region: this.state.region};
        const dbRefs = await mycrt.validateCredentials(awsKeys);
        if (dbRefs) {
            this.setState({dbRefs});
            this.changeProgress(4);
        } else {
            this.setState({credentialsValid: 'invalid'});
            logger.error("THERE WAS AN ERROR");
        }
        const bucketList = await mycrt.validateBuckets(awsKeys);
        if (bucketList) {
            this.setState({bucketList});
        } else {
            logger.error("THERE WAS AN ERROR");
        }
    }

    public async validateDB(event: any) {
        const dbRef = {dbName: this.state.dbName, host: this.state.host,
            user: this.state.user, pass: this.state.pass};
        const validate = await mycrt.validateDatabase(dbRef);
        if (validate) {
            this.setState({dbCredentialsValid: 'valid'});
            this.changeProgress(5);
        } else {
            this.setState({dbCredentialsValid: 'invalid'});
            logger.error("Could not validate db");
        }
    }

   public async validateInviteCode(event: any) {
      const result = await mycrt.acceptEnvironmentInvite(this.state.inviteCode);
      if (!result) {
         this.setState({errorMsg: "Invite code was invalid."});
         return;
      }
      this.setState({sharedEnv: result});
      this.changeProgress(7);
   }

    public handleDBName(event: any) {
        const target = event.currentTarget;
        if (target.value === "default") {
           this.setState({dbName: '', disabled: true});
           return;
        }
        const dbRef = JSON.parse(target.value);
        this.setState({dbName: dbRef.name, instance: dbRef.instance, parameterGroup: dbRef.parameterGroup,
        host: dbRef.host, user: dbRef.user, pass: "", invalidDBPass: false});
    }

   public handlePrefixChange(event: any) {
      this.setState({prefix: event.target.value });
   }

   public handleInviteCode(event: any) {
      const inviteCode = event.target.value;
      let disabled = false;
      if (inviteCode === "") {
         disabled = true;
      }
      this.setState({inviteCode, disabled, errorMsg: ""});
   }

    public handleS3Ref(event: any) {
        const bucket = event.currentTarget.value;
        if (bucket === "default") {
            this.setState({bucket: '', disabled: true});
        } else {
            this.setState({bucket, disabled: false});
        }
    }

    public handleRegionChange(event: any) {
       const value = event.target.value;
       let disabled = this.state.disabled;
       if (value === "default") {
         disabled = true;
       }
       this.setState({region: value, credentialsValid: 'valid', disabled});
    }

    public handleInputChange(event: any) {
      this.setState({[event.target.id]: event.target.value, credentialsValid: 'valid'});
      this.setState({disabled: false});
    }

    public handlePasswordChange(event: any) {
       this.setState({[event.target.id]: event.target.value, dbCredentialsValid: 'valid', disabled: false});
    }

    public handleNameChange(event: any) {
      if (/^[a-zA-Z0-9][a-zA-Z0-9 :_-]{3,24}$/.test(event.target.value)) {
         this.setState({envNameValid: 'valid', disabled: false});
      } else {
         this.setState({envNameValid: 'invalid', disabled: true});
      }
      this.setState({[event.target.id]: event.target.value, envNameDuplicate: false});
    }

    public async createEnvironment() {
        const envObj = await mycrt.createEnvironment(this.state as IEnvironmentFull);
        if (!envObj) {
            logger.error("Could not create environment");
        } else {
            logger.info(`${envObj.name} was made with id ${envObj.id}`);
            const cancelBtn = document.getElementById("cancelBtn");
            this.props.update();
            if (cancelBtn) {
                cancelBtn.click();
            }
        }
    }

    public async handleEvent(event: any) {
      const step = this.state.modalPage;
      if (step === '1') {
         if (this.state.newEnv) {
            this.changeProgress(2);
         } else {
            this.changeProgress(6);
         }
      } else if (step === '2' && this.state.envNameValid === 'valid') {
         this.validateName(event.target.value);
      } else if (step === '3') {
         this.validateCredentials(event.target.value);
      } else if (step === '4') {
         this.validateDB(event.target.value);
      } else if (step === '5') {
         this.createEnvironment();
      } else if (step === '6') {
         this.validateInviteCode(event.target.value);
      }
    }

    public cancelModal(event: any) {
      $("select#regionDrop").val('default');
      $(`#newEnvRadio`).click();
      this.changeProgress(1);
      this.setState(this.baseState);
    }

    public render() {
       const regions: JSX.Element[] = [];
         for (const region of awsRegions) {
            regions.push((<option value={region}>{region}</option>));
         }
        const databases: JSX.Element[] = [];
        if (this.state.dbRefs) {
           for (const db of this.state.dbRefs) {
              databases.push((<option value={JSON.stringify(db)}>{db.name}</option>));
           }
        }
        const buckets: JSX.Element[] = [];
        if (this.state.bucketList) {
           for (const bucket of this.state.bucketList) {
              buckets.push((<option value={bucket}>{bucket}</option>));
           }
        }
        return (
            <div id={this.props.id} className="modal fade" role="dialog"
                aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header myCRT-modal-header">
                            <h4 className="modal-title">Environment Setup</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close"
                                onClick={this.cancelModal}>
                                <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" id="envWizard">
                           {parseInt(this.state.modalPage) > 1 && parseInt(this.state.modalPage) < 5 ?
                              <div className="progress" style={{height: "20px", fontSize: "12px"}}>
                                 <div className="progress-bar bg-success" role="progressbar" aria-valuenow={1}
                                       aria-valuemin={1} aria-valuemax={3} style={{width: "25%"}}>
                                 Step 1 of 4
                                 </div>
                              </div> : null}
                            <div className="navbar myCRT-env-navbar" style={{display: "none"}}>
                                <div className="navbar-inner">
                                    <ul className="nav nav-pills">
                                       <li className= "nav-item"><a className= "nav-link"
                                            href="#step1" data-toggle="tab" data-step="1">Step 1</a></li>
                                       <li className= "nav-item"><a className="nav-link"
                                            href="#step2" data-toggle="tab" data-step="2">Step 2</a></li>
                                       <li className= "nav-item"><a className="nav-link"
                                            href="#step3" data-toggle="tab" data-step="3">Step 3</a></li>
                                       <li className= "nav-item"><a className="nav-link"
                                            href="#step4" data-toggle="tab" data-step="4">Step 4</a></li>
                                       <li className= "nav-item"><a className="nav-link"
                                            href="#step5" data-toggle="tab" data-step="5">Step 5</a></li>
                                       <li className= "nav-item"><a className="nav-link"
                                            href="#step6" data-toggle="tab" data-step="6">Step 6</a></li>
                                       <li className= "nav-item"><a className="nav-link"
                                            href="#step7" data-toggle="tab" data-step="7">Step 7</a></li>
                                    </ul>
                                </div>
                            </div>
                            <br />
                            <div className="tab-content">
                              <div className="tab-pane myCRT-tab-pane fade show active" id="step1">
                                 <div className="card card-body bg-light">
                                    <label><b>Environment Options</b></label>
                                    <div className="form-check">
                                       <label className="form-check-label" style={{padding: "5px"}}>
                                             <input type="radio" className="form-check-input"
                                                   name="env options" id="newEnvRadio" defaultChecked
                                                   onChange={this.handleOptionChange} defaultValue="newEnv"/>
                                             Create New
                                       </label>
                                    </div>
                                    <div className="form-check">
                                       <label className="form-check-label" style={{padding: "5px"}}>
                                             <input type="radio" className="form-check-input"
                                                   name="env options" id="addEnvRadio"
                                                   onChange={this.handleOptionChange} defaultValue="oldEnv"/>
                                             Add Existing <i>(Invite Code Required)</i>
                                       </label>
                                    </div>
                                 </div>
                              </div>
                              <div className="tab-pane myCRT-tab-pane fade" id="step2">
                                 <div className="card card-body bg-light">
                                       <label>Environment Name</label>
                                       <input className={`form-control input-lg is-${this.state.envNameValid}`}
                                       placeholder="Enter Name"
                                       value={this.state.envName} id="envName"
                                       onInput={this.handleNameChange.bind(this)}/>
                                    <div className={`${this.state.envNameValid}-feedback`}>
                                       {this.state.envNameValid === 'valid' ? "Looks good!" :
                                          `Please provide a name with 4-25 alphanumeric characters.
                                          The following characters are also allowed: -_:`}</div>
                                       <br/>
                                    <div className="text-danger">
                                       {this.state.envNameDuplicate ?
                                          `An environment already exists with this name.
                                             Please use a different one.` : ''}</div>
                                 </div>
                                </div>
                              <div className="tab-pane myCRT-tab-pane fade" id="step3">
                                 <div className="card card-body bg-light">
                                       <label> AWS Keys </label>
                                       <input className="form-control input-lg" placeholder="Enter Access Key"
                                          value={this.state.accessKey} id="accessKey"
                                          onInput={this.handleInputChange.bind(this)}/> <br/>
                                       <input className="form-control input-lg" placeholder="Enter Secret Key"
                                          value={this.state.secretKey} id="secretKey"
                                          onInput={this.handleInputChange.bind(this)}/> <br/>
                                       {<select className="form-control" id="regionDrop"
                                          onChange={this.handleRegionChange.bind(this)}>
                                          <option value='default'>Enter Region...</option>
                                          {regions}
                                       </select>}
                                    <br></br>
                                    <div className="text-danger">
                                       {this.state.credentialsValid === 'valid' ? "" :
                                          `Credentials were invalid. Please check them and try again.`}</div>
                                 </div>
                              </div>
                              <div className="tab-pane myCRT-tab-pane fade" id="step4">
                                 <div className="card card-body bg-light">
                                       <label><b>DB Reference</b></label>
                                       {<select className="form-control input-lg"
                                          onChange={this.handleDBName.bind(this)}>
                                          <option value="default">Select Database...</option>
                                          {databases}
                                       </select>} <br/>
                                       <div style={this.state.dbName !== "" ? {display: "block"} : {display: "none"}}>
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
                                          <input className="form-control" id="pass" value={this.state.pass}
                                             placeholder="Enter Password" type="password"
                                             onInput={this.handlePasswordChange.bind(this)}/>
                                       </div>
                                       <br></br>
                                       <div className="text-danger">
                                       {this.state.dbCredentialsValid === 'valid' ? "" :
                                          `Password was invalid. Please try again.`}</div>
                                 </div>
                                 <br/>
                              </div>
                              <div className="tab-pane myCRT-tab-pane fade" id="step5">
                                 <div className="card card-body bg-light">
                                       <label>S3 Reference</label>
                                       {<select className="form-control input-lg"
                                          onChange={this.handleS3Ref.bind(this)}>
                                          <option value="default">Select S3 Bucket...</option>
                                          {buckets}
                                       </select>} <br/>
                                       <label>Prefix Name (Optional):</label>
                                       <input className="form-control input-lg"
                                       placeholder="Enter S3 Prefix"
                                       value={this.state.prefix} id="prefix"
                                       onInput={this.handlePrefixChange.bind(this)}/>
                                 </div>
                              </div>
                              <div className="tab-pane myCRT-tab-pane fade" id="step6">
                                 <div className="card card-body bg-light">
                                    <label><b>Enter Invite Code:</b></label>
                                    <input type="name" id="inviteCode" className={`form-control`}
                                       value={this.state.inviteCode} onChange={this.handleInviteCode}
                                       placeholder="Enter code"></input>
                                    <small id="sharedInviteCode" className="form-text text-muted"></small>
                                    <br/>
                                    <div className="text-danger">{this.state.errorMsg}</div>
                                 </div>
                                 <br/>
                              </div>
                              <div className="tab-pane myCRT-tab-pane fade" id="step7">
                                 <div className="card card-body bg-light">
                                    <h5>You are now a part of</h5>
                                    <h4 style={{paddingLeft: "20px"}}>{this.state.sharedEnv.envName}</h4>
                                    <br/>
                                    <h5>You may now add captures to {this.state.sharedEnv.dbName}!</h5>
                                 </div>
                                 <br/>
                              </div>
                              <div className="modal-footer">
                                 <button className="btn btn-secondary" data-dismiss="modal" id="cancelBtn"
                                       aria-hidden="true" onClick={this.cancelModal}>Close</button>
                                 {this.state.modalPage !== '7' ?
                                    <button className="btn btn-info" onClick={this.handleEvent.bind(this)}
                                    disabled={this.state.disabled}>
                                    {this.state.buttonText}</button> : null}
                              </div>
                           </div>
                        </div>
                    </div>
               </div>
         </div>
      );
   }
}
