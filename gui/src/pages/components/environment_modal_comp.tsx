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

        $(document).ready(() => {
            $('a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
              // update progress
              const step = $(e.target).data('step');
              const percent = (parseInt(step) / 3) * 100;
              $('.progress-bar').css({width: percent + '%'});
              $('.progress-bar').text("Step " + step + " of 3");
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
                        <div className="modal-body" id="envWizard">
                            <div className="progress" style={{height: "20px", fontSize: "12px"}}>
                                <div className="progress-bar bg-success" role="progressbar" aria-valuenow={1}
                                    aria-valuemin={1} aria-valuemax={3} style={{width: "33%"}}>
                                Step 1 of 3
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
                                    </ul>
                                </div>
                            </div>
                            <div className="tab-content">
                                <div className="tab-pane myCRT-tab-pane fade show active" id="step1">
                                    <div className="card card-body bg-light">
                                        <label>IAM Credentials</label>
                                        <input className="form-control input-lg" placeholder="Enter Credentials"/>
                                    </div>
                                    <br></br>
                                    <a className="btn btn-success next" href="#">Continue ></a>
                                    <br></br>
                                </div>
                                <div className="tab-pane myCRT-tab-pane fade" id="step2">
                                    <div className="card card-body bg-light">
                                        <label>DB Reference</label>
                                        <input className="form-control input-lg" placeholder="Enter DB Reference"/>
                                    </div>
                                    <br></br>
                                    <a className="btn btn-success next" href="#">Continue ></a>
                                    <br></br>
                                </div>
                                <div className="tab-pane myCRT-tab-pane fade" id="step3">
                                    <div className="card card-body bg-light">
                                        <label>S3 Reference</label>
                                        <input className="form-control input-lg" placeholder="Enter S3 Reference"/>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" data-dismiss="modal"
                                        aria-hidden="true">Close</button>
                                    <button className="btn btn-info">Save changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
