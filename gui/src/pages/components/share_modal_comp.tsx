import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class ShareModal extends React.Component<any, any>  {

   private baseState = {} as any;

   constructor(props: any) {
      super(props);
      this.state = { disabled: true, email: "", errorMsg: "", step: "1", inviteCode: "", isAdmin: false};
      this.baseState = this.state;
      this.cancelModal = this.cancelModal.bind(this);
      this.handleEmailChange = this.handleEmailChange.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleIsAdminChange = this.handleIsAdminChange.bind(this);
   }

   public handleEmailChange(event: any) {
      const email = event.currentTarget.value;
      let disabled = false;
      if (email === "") {
         disabled = true;
      }
      this.setState({email, disabled, errorMsg: ""});
   }

   public cancelModal(event: any) {
      this.setState(this.baseState);
      $('#isAdminCheck').prop("checked", false);
      $('#shareWizard a[href="#step1"]').tab('show');
      this.render();
   }

   public async handleClick(event: any) {
      const isDuplicate = await mycrt.validateEnvironmentEmailInvite(this.props.envId,
         this.state.email, this.state.isAdmin);
      if (!isDuplicate) {
         this.setState({errorMsg: "Cannot invite yourself to environment"});
         return;
      }

      const result = await mycrt.environmentInvite(this.props.envId, this.state.email, this.state.isAdmin);

      if (!result) {
         this.setState({errorMsg: "User email does not exist. Please try again with a valid email."});
         return;
      }

      if (result.accepted) {
         this.setState({errorMsg: `${this.state.email} is already a member of this environment`});
         return;
      }
      this.setState({inviteCode: result.inviteCode, step: "2"});
      $('#shareWizard a[href="#step2"]').tab('show');
   }

   public handleIsAdminChange(event: any) {
      this.setState({isAdmin: event.target.checked});
   }

   public render() {
      return (
         <div className="modal fade" id={this.props.id} role="dialog"
            aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div className="modal-dialog" role="document">
               <div className="modal-content myCRT-modal">
                  <div className="modal-header myCRT-modal-header">
                     <h4 className="modal-title">Share <i>{this.props.name}</i></h4>
                     <button type="button" className="close" data-dismiss="modal"
                        onClick={this.cancelModal} aria-label="Close">
                        <span aria-hidden="true" style={{color: "white"}}>&times;</span>
                     </button>
                  </div>
                  <div className="modal-body" id="shareWizard">
                     <div className="navbar myCRT-env-navbar" style={{display: "none"}}>
                        <div className="navbar-inner">
                           <ul className="nav nav-pills">
                                 <li className= "nav-item"><a className= "nav-link active"
                                    href="#step1" data-toggle="tab" data-step="1">Step 1</a></li>
                                 <li className= "nav-item"><a className="nav-link"
                                    href="#step2" data-toggle="tab" data-step="2">Step 2</a></li>
                           </ul>
                        </div>
                     </div>
                     <br />
                     <div className="tab-content">
                        <div className="tab-pane myCRT-tab-pane fade show active" id="step1">
                           <div className="card card-body bg-light">
                              <label><b>Enter User Email to Share:</b></label>
                              <input type="name" id="shareEnv" className={`form-control`}
                                 value={this.state.email} onChange={this.handleEmailChange}
                                 aria-describedby="shareEnv" placeholder="Enter email"></input>
                              <small id="shareEnv" className="form-text text-muted"></small>
                              <br/>
                              <div className="form-check">
                                 <label className="form-check-label">
                                 <input type="checkbox" className="form-check-input" id="isAdminCheck"
                                    onChange={this.handleIsAdminChange}
                                    defaultChecked={this.state.isAdmin}/>
                                    Grant Admin Privileges
                                 </label>
                              </div>
                           </div>
                           <br/>
                           <div className="text-danger">
                              {this.state.errorMsg}
                           </div>
                        </div>
                        <div className="tab-pane myCRT-tab-pane fade" id="step2">
                           <div className="card card-body bg-light">
                              <h4>User has been verified!</h4>
                              <br/>
                              <h6>Please share the following invite code with <i>{this.state.email} </i>
                                    within the next 24 hours.</h6><br/>
                              <h6>Invite Code: <span style={{fontWeight: "bold", display: "inline"}}>
                                 {this.state.inviteCode}</span></h6>
                           </div>
                        </div>
                        <div className="modal-footer">
                           <button className="btn btn-secondary" data-dismiss="modal" id="cancelShareBtn"
                                 aria-hidden="true" onClick={this.cancelModal}>Close</button>
                           {this.state.step === "1" ? <button className="btn btn-info"
                              onClick={this.handleClick.bind(this)}
                              disabled={this.state.disabled}>Get Invite Code</button> : null}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }
}
