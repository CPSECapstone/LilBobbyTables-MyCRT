import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType, IEnvironmentFull, IIamReference } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class EnvModal extends React.Component<any, any>  {

    private baseState = {} as any;

    constructor(props: any) {
        super(props);
        this.createEnvironment = this.createEnvironment.bind(this);
        this.validateCredentials = this.validateCredentials.bind(this);
        this.validateDB = this.validateDB.bind(this);
        this.goToNextStep = this.goToNextStep.bind(this);
        this.cancelModal = this.cancelModal.bind(this);
        this.changeProgress = this.changeProgress.bind(this);
        this.state = {envName: "", accessKey: "", secretKey: "", region: "", bucketList: [],
                      dbName: "", pass: "", bucket: "", dbRefs: [], invalidDBPass: false};
        this.baseState = this.state;
    }

    public changeProgress(step: number) {
        const percent = (step / 4) * 100;
        $('.progress-bar').css({width: percent + '%'});
        $('.progress-bar').text("Step " + step + " of 4");
        $('#envWizard a[href="#step' + step + '"]').tab('show');
    }

    public async validateCredentials(event: any) {
        const iamRef = {accessKey: this.state.accessKey, secretKey: this.state.secretKey, region: this.state.region};
        const dbRefs = await mycrt.validateCredentials(iamRef);
        if (dbRefs) {
            this.setState({dbRefs});
            this.changeProgress(3);
        } else {
            logger.error("THERE WAS AN ERROR");
        }
        const bucketList = await mycrt.validateBuckets(iamRef);
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
            this.setState({invalidDBPass: false});
            this.changeProgress(4);
        } else {
            this.setState({invalidDBPass: true});
            logger.error("Could not validate db");
        }
    }

    public goToNextStep(event: any) {
        const target = event.currentTarget;
        const nextStep = parseInt(target.id) + 1;
        const percent = (nextStep / 4) * 100;
        $('.progress-bar').css({width: percent + '%'});
        $('.progress-bar').text("Step " + nextStep + " of 4");
        $('#envWizard a[href="#step' + nextStep + '"]').tab('show');
    }

    public handleDBName(event: any) {
        const target = event.currentTarget;
        const dbRef = JSON.parse(target.value);
        this.setState({dbName: dbRef.name, instance: dbRef.instance, parameterGroup: dbRef.parameterGroup,
        host: dbRef.host, user: dbRef.user, pass: "", invalidDBPass: false});
    }

    public handleS3Ref(event: any) {
        const bucket = event.currentTarget.value;
        this.setState({bucket});
    }

    public handleInputChange(event: any) {
        this.setState({[event.target.id]: event.target.value});
    }

    public async createEnvironment() {
        if (!this.state.bucket) {
            logger.error("Please fill in all fields");
            $('#envWarning').show();
            return;
        }
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

    public cancelModal(event: any) {
        this.setState(this.baseState);
        this.changeProgress(1);
    }

    public render() {
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
                        <WarningAlert id="envWarning" msg="Please fill in all the provided fields."
                            style = {{display: "none"}}/>
                        <div className="modal-body" id="envWizard">
                            <div className="progress" style={{height: "20px", fontSize: "12px"}}>
                                <div className="progress-bar bg-success" role="progressbar" aria-valuenow={1}
                                    aria-valuemin={1} aria-valuemax={3} style={{width: "25%"}}>
                                Step 1 of 4
                                </div>
                            </div>
                            <div className="navbar myCRT-env-navbar" style={{display: "none"}}>
                                <div className="navbar-inner">
                                    <ul className="nav nav-pills">
                                        <li className= "nav-item"><a className= "nav-link active"
                                            href="#step1" data-toggle="tab" data-step="1">Step 1</a></li>
                                        <li className= "nav-item"><a className="nav-link"
                                            href="#step2" data-toggle="tab" data-step="2">Step 2</a></li>
                                        <li className= "nav-item"><a className="nav-link"
                                            href="#step3" data-toggle="tab" data-step="3">Step 3</a></li>
                                        <li className= "nav-item"><a className="nav-link"
                                            href="#step4" data-toggle="tab" data-step="4">Step 4</a></li>
                                    </ul>
                                </div>
                            </div>
                            <br />
                            <div className="tab-content">
                                <div className="tab-pane myCRT-tab-pane fade show active" id="step1">
                                    <div className="card card-body bg-light">
                                        <label>Environment Name</label>
                                        <input className="form-control input-lg" placeholder="Enter Name"
                                            value={this.state.envName} id="envName"
                                            onChange={this.handleInputChange.bind(this)}/>
                                    </div>
                                    <br></br>
                                    <a className="btn btn-success next" id="1" href="#"
                                        onClick={this.goToNextStep}>Continue ></a>
                                    <br></br>
                                </div>
                                <div className="tab-pane myCRT-tab-pane fade" id="step2">
                                    <div className="card card-body bg-light">
                                        <label>IAM Credentials</label>
                                        <input className="form-control input-lg" placeholder="Enter Access Key"
                                            value={this.state.accessKey} id="accessKey"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Secret Key"
                                            value={this.state.secretKey} id="secretKey"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Region"
                                            value={this.state.region} id="region"
                                            onChange={this.handleInputChange.bind(this)}/>
                                    </div>
                                    <br></br>
                                    <a className="btn btn-success next" id ="2" href="#"
                                        onClick={this.validateCredentials}>Continue ></a>
                                    <br></br>
                                </div>
                                <div className="tab-pane myCRT-tab-pane fade" id="step3">
                                    <div className="card card-body bg-light">
                                        <label><b>DB Reference</b></label>
                                        {<select className="form-control input-lg"
                                            onChange={this.handleDBName.bind(this)}><option>Select Database...</option>
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
                                            <input className={this.state.invalidDBPass ? "form-control is-invalid" :
                                                "form-control"} id="pass" value={this.state.pass}
                                                placeholder="Enter Password" type="password"
                                                onChange={this.handleInputChange.bind(this)}/>
                                            {this.state.invalidDBPass ? <div className="invalid-feedback">
                                                The password given was invalid.</div> : <div className="valid-feedback">
                                                Database has been validated</div>}
                                        </div>
                                    </div>
                                    <br/>
                                    <a className="btn btn-success next" id ="3" href="#"
                                        onClick={this.validateDB}>Continue ></a>
                                    <br/>
                                </div>
                                <div className="tab-pane myCRT-tab-pane fade" id="step4">
                                    <div className="card card-body bg-light">
                                        <label>S3 Reference</label>
                                        {<select className="form-control input-lg"
                                            onChange={this.handleS3Ref.bind(this)}><option>Select S3 Bucket...</option>
                                            {buckets}
                                        </select>} <br/>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" data-dismiss="modal" id="cancelBtn"
                                        aria-hidden="true" onClick={this.cancelModal}>Close</button>
                                    <button className="btn btn-info" onClick={this.createEnvironment}>
                                        Save changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
