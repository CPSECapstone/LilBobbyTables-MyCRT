import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus, IChildProgram } from '@lbt-mycrt/common/dist/data';

import './common';

import '../../static/css/index.css';

import { BrowserLogger as logger } from '../logging';
import { CaptureModal } from './components/capture_modal_comp';
import { CapturePanel } from './components/capture_panel_comp';
import { DeleteModal } from './components/delete_modal_comp';
import { ReplayModal } from './components/replay_modal_comp';
import { ReplayPanel } from './components/replay_panel_comp';
import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

class DashboardApp extends React.Component<any, any> {

    public constructor(props: any) {
        super(props);
        this.componentWillMount = this.componentWillMount.bind(this);
        this.deleteEnv = this.deleteEnv.bind(this);
        let id: any = null;
        const match = window.location.search.match(/.*\?.*id=(\d+)/);
        if (match) {
            id = match[1];
        }
        this.state = { envId: id, env: null, captures: [], replays: [] };
    }

   public async setCaptures() {
       const capturesResponse = await mycrt.getCaptures();
       if (capturesResponse !== null) {
           this.setState({
                captures: capturesResponse,
            });
        }
    }

    public async setReplays() {
        const replaysResponse = await mycrt.getReplays();
        if (replaysResponse !== null) {
            this.setState({
                replays: replaysResponse,
            });
        }
    }

    public async componentWillMount() {
        if (this.state.envId) {
            this.setState({
                  env: await mycrt.getEnvironment(this.state.envId),
            });
        }
        this.setCaptures();
        this.setReplays();
    }

    public async deleteEnv(id: number, deleteLogs: boolean) {
        await mycrt.deleteEnvironment(id, deleteLogs);
        window.location.assign('./environments');
    }

    public render() {
        if (!this.state.env) { return (<div></div>); }
        const liveCaptures: JSX.Element[] = [];
        const pastCaptures: JSX.Element[] = [];
        if (this.state.captures) {
            for (const capture of this.state.captures) {
                let name = `${capture.name}`;
                if (!name) {
                    name = `capture ${capture.id}`;
                }
                if (capture.status === ChildProgramStatus.STOPPING || capture.status === ChildProgramStatus.DONE) {
                    pastCaptures.push((<CapturePanel title={name} capture={capture} envId = {this.state.envId} />));
                } else {
                    liveCaptures.push((<CapturePanel title={name} capture={capture} envId = {this.state.envId}/>));
                }
            }
        }
      const liveReplays: JSX.Element[] = [];
      const pastReplays: JSX.Element[] = [];
      if (this.state.replays) {
         for (const replay of this.state.replays) {
            let name = `${replay.name}`;
            if (!name) {
                name = `replay ${replay.id}`;
            }
            let captureObj = null;
            if (this.state.captures) {
                captureObj = this.state.captures.find((item: IChildProgram) => item.id === replay.captureId);
            }
            if (replay.status === "queued" || replay.status === ChildProgramStatus.DONE) {
                pastReplays.push((<ReplayPanel title={name} replay={replay}
                    capture={captureObj} envId = {this.state.envId}/>));
            } else {
                liveReplays.push((<ReplayPanel title={name} replay={replay}
                    capture={captureObj} envId = {this.state.envId}/>));
            }
         }
      }
      return (
         <div>
            <nav>
               <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                  <li className="breadcrumb-item active">{this.state.env.name}</li>
               </ol>
            </nav>

            <div className="container">
               <div className="row">
                  <div className="col-xs-12">
                     <h1 style={{display: "inline"}}>{this.state.env.name}</h1>
                     <a role="button" className="btn btn-danger" data-toggle="modal" href="#"
                           data-target="#deleteEnvModal" style={{marginBottom: "20px", marginLeft: "12px"}}>
                            <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
                        </a>
                        <DeleteModal id="deleteEnvModal" deleteId={this.state.env.id}
                               name={this.state.env.name} delete={this.deleteEnv} type="Environment"/>
                  </div>
               </div>
               <br></br>
               <div className="row">
                  <div className="col-xs-12 col-md-5 mb-r">
                     <div>
                        <h2 style={{display: "inline"}}>Captures</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                           data-target="#captureModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <CaptureModal id="captureModal" envId={this.state.envId} update={this.componentWillMount}/>
                     </div>
                     <br></br>
                     {liveCaptures.length === 0 ? null : <h4>Live</h4>}
                     {liveCaptures}
                     <br></br>
                     {pastCaptures.length === 0 ? null : <h4>Past</h4>}
                     {pastCaptures}
                     <br></br>
                  </div>
                  <div className="col-xs-12 col-md-5 offset-md-1 mb-r">
                     <div>
                        <h2 style={{display: "inline"}}>Replays</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                            data-target="#replayModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <ReplayModal id="replayModal" captures={this.state.captures}
                            envId = {this.state.envId} update={this.componentWillMount}/>
                     </div>
                     <br></br>
                     {liveReplays.length === 0 ? null : <h4>Live</h4>}
                     {liveReplays}
                     <br></br>
                     {pastReplays.length === 0 ? null : <h4>Past</h4>}
                     {pastReplays}
                     <br></br>
                  </div>
               </div>

            </div>
         </div>
      );
   }
}

ReactDom.render(<DashboardApp />, document.getElementById('dashboard-app'));
