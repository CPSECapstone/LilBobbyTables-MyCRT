import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class EnvModal extends React.Component<any, any>  {

    constructor(props: any) {
        super(props);
        this.createEnvironment = this.createEnvironment.bind(this);
        this.state = {envName: "", accessKey: "", secretKey: "", region: "",
                      dbName: "", host: "", user: "", pass: "", bucket: "",
                      instance: "", parameterGroup: ""};

        $(document).ready(() => {
            $('a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
              // update progress
              const step = $(e.target).data('step');
              const percent = (parseInt(step) / 4) * 100;
              $('.progress-bar').css({width: percent + '%'});
              $('.progress-bar').text("Step " + step + " of 4");
              // e.relatedTarget // previous tab
            });
            $('.next').click(function() {
                const nextId = $(this).parents('.tab-pane').next().attr("id");
                $('#envWizard a[href="#' + nextId + '"]').tab('show');
                return false;
              });
            $('.first').click( () => {
              $('#envWizard a:first').tab('show');
            });
          });
    }

    public handleInputChange(event: any) {
        this.setState({[event.target.id]: event.target.value});
    }

    public allFieldsFilled() {
        return this.state.envName !== "" && this.state.accessKey !== "" && this.state.secretKey !== ""
            && this.state.region !== "" && this.state.host !== "" && this.state.user !== ""
            && this.state.dbName !== "" && this.state.pass !== "" && this.state.bucket !== ""
            && this.state.instance !== "" && this.state.parameterGroup !== "";
    }

    public async createEnvironment() {
        if (!this.allFieldsFilled()) {
            logger.error("Please fill in all fields");
            $('#envWarning').show();
            return;
        }
        const envObj = await mycrt.createEnvironment(
            {name: this.state.envName},
            {accessKey: this.state.accessKey, secretKey: this.state.secretKey,
            region: this.state.region},
            {host: this.state.host, user: this.state.user, name: this.state.dbName,
            pass: this.state.pass, instance: this.state.instance, parameterGroup: this.state.parameterGroup},
            {bucket: this.state.bucket});
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

    public render() {
        return (
            <div id={this.props.id} className="modal fade" role="dialog"
                aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header myCRT-modal-header">
                            <h4 className="modal-title">Environment Setup</h4>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
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
                            <div className="navbar myCRT-env-navbar">
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
                            <div className="tab-content">
                                <div className="tab-pane myCRT-tab-pane fade show active" id="step1">
                                    <div className="card card-body bg-light">
                                        <label>Environment Name</label>
                                        <input className="form-control input-lg" placeholder="Enter Name"
                                            value={this.state.envName} id="envName"
                                            onChange={this.handleInputChange.bind(this)}/>
                                    </div>
                                    <br></br>
                                    <a className="btn btn-success next" href="#">Continue ></a>
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
                                    <a className="btn btn-success next" href="#">Continue ></a>
                                    <br></br>
                                </div>
                                <div className="tab-pane myCRT-tab-pane fade" id="step3">
                                    <div className="card card-body bg-light">
                                        <label>DB Reference</label>
                                        <input className="form-control input-lg" placeholder="Enter DB Name"
                                            value={this.state.dbName} id="dbName"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Instance"
                                            value={this.state.instance} id="instance"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Parameter Group"
                                            value={this.state.parameterGroup} id="parameterGroup"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Host"
                                            value={this.state.host} id="host"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter User"
                                            value={this.state.user} id="user"
                                            onChange={this.handleInputChange.bind(this)}/> <br/>
                                        <input className="form-control input-lg" placeholder="Enter Pass"
                                            value={this.state.pass} id="pass"
                                            onChange={this.handleInputChange.bind(this)}/>
                                    </div>
                                    <br/>
                                    <a className="btn btn-success next" href="#">Continue ></a>
                                    <br/>
                                </div>
                                <div className="tab-pane myCRT-tab-pane fade" id="step4">
                                    <div className="card card-body bg-light">
                                        <label>S3 Reference</label>
                                        <input className="form-control input-lg" placeholder="Enter S3 Bucket"
                                            value={this.state.bucket} id="bucket"
                                            onChange={this.handleInputChange.bind(this)}/>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" data-dismiss="modal" id="cancelBt"
                                        aria-hidden="true">Close</button>
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
