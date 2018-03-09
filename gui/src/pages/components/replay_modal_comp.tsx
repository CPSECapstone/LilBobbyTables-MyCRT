import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus, ChildProgramType, IReplayFull } from '@lbt-mycrt/common/dist/data';
import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';

import { WarningAlert } from './alert_warning_comp';

export class ReplayModal extends React.Component<any, any>  {

    private baseState = {} as any;

    constructor(props: any) {
        super(props);
        this.state = { name: "", captureId: "", host: "", parameterGroup: "",
                       user: "", pass: "", instance: "", dbName: "", type: ChildProgramType.REPLAY,
                       env: this.props.env, dbRefs: [], invalidDBPass: false};
        this.baseState = this.state;
        this.handleDBName = this.handleDBName.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
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

    public allFieldsFilled() {
        return this.state.captureId && this.state.dbName && this.state.pass && this.state.name;
    }

    public handleInputChange(event: any) {
        this.setState({[event.currentTarget.id]: event.currentTarget.value});
    }

    public async startReplay() {
        const replayObj = await mycrt.startReplay(this.state as IReplayFull);
        if (!replayObj) {
            logger.error("Could not start replay");
        } else {
            const cancelBtn = document.getElementById("cancelReplayBtn");
            this.props.update();
            if (cancelBtn) {
                cancelBtn.click();
            }
        }
    }

    public async validateDB(event: any) {
        if (!this.allFieldsFilled()) {
            logger.error("Please fill in all fields");
            $('#replayWarning').show();
            return;
        }
        const dbRef = {dbName: this.state.dbName, host: this.state.host,
            user: this.state.user, pass: this.state.pass};
        const validate = await mycrt.validateDatabase(dbRef);
        if (validate) {
            this.setState({invalidDBPass: false});
            this.startReplay();
        } else {
            this.setState({invalidDBPass: true});
        }
    }

    public handleCaptureId(event: any) {
        const index = event.target.selectedIndex;
        const optionElement = event.target.childNodes[index];
        const captureId =  optionElement.getAttribute('id');
        this.setState({captureId});
    }

    public handleDBName(event: any) {
        const target = event.currentTarget;
        const dbRef = JSON.parse(target.value);
        this.setState({dbName: dbRef.name, instance: dbRef.instance, parameterGroup: dbRef.parameterGroup,
        host: dbRef.host, user: dbRef.user, pass: "", invalidDBPass: false});
    }

    public cancelModal(event: any) {
        this.setState(this.baseState);
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
              captures.push((<option id={capture.id}>{name}</option>));
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
                        <WarningAlert id="replayWarning" msg="Please fill in all the provided fields."
                                      style = {{display: "none"}}/>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <div className="card card-body bg-light">
                                        <label><b>Replay Name</b></label>
                                        <input type="name" className="form-control" id="name"
                                        value={this.state.name} onChange={this.handleInputChange.bind(this)}
                                        aria-describedby="replayName" placeholder="Enter name"></input>
                                            <small id="replayName" className="form-text text-muted"></small>
                                        <br/>
                                        <label><b>Capture</b></label>
                                        {<select className="form-control" onChange={this.handleCaptureId.bind(this)}
                                            defaultValue=''>
                                            <option>Select Capture...</option>
                                            {captures}
                                        </select>}
                                        <br/>
                                        <div style={this.state.captureId ? {display: "block"} : {display: "none"}}>
                                            <label><b>DB Reference</b></label>
                                            {<select className="form-control input-lg"
                                                onChange={this.handleDBName.bind(this)}><option>Select Database...
                                                    </option>{databases}
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
                                                <input className={this.state.invalidDBPass ?
                                                "form-control is-invalid" :
                                                    "form-control"} id="pass" value={this.state.pass}
                                                    placeholder="Enter Password" type="password"
                                                    onChange={this.handleInputChange.bind(this)}/>
                                                {this.state.invalidDBPass ? <div className="invalid-feedback">
                                                    The password given was invalid.</div> :
                                                    <div className="valid-feedback">Database has been
                                                    validated</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" id="cancelReplayBtn"
                                    data-dismiss="modal" onClick={this.cancelModal}>Cancel</button>
                            <button type="button" className="btn btn-info"
                                    onClick={this.validateDB.bind(this)}>Save Replay</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
