import React = require('react');
import ReactDom = require('react-dom');

import { ChildProgramStatus, IChildProgram } from '@lbt-mycrt/common/dist/data';

import './common';

import '../../static/css/index.css';

import { BrowserLogger as logger } from '../logging';
import { CaptureModal } from './components/capture_modal_comp';
import { CapturePanel } from './components/capture_panel_comp';
import { ReplayModal } from './components/replay_modal_comp';
import { ReplayPanel } from './components/replay_panel_comp';
import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

class DashboardApp extends React.Component<any, any> {

   public constructor(props: any) {
      super(props);
      this.state = {captures: []};
   }

   public async componentWillMount() {
      const capturesResponse = await mycrt.getCaptures();
      logger.info(JSON.stringify(capturesResponse));
      if (capturesResponse !== null) {
         this.setState({
            captures: capturesResponse,
         });
      }
   }

   public render() {
      const liveCaptures: JSX.Element[] = [];
      const pastCaptures: JSX.Element[] = [];
      if (this.state.captures) {
         for (const capture of this.state.captures) {
            let name = `${capture.name}`;
            if (!name) {
                name = `capture ${capture.id}`;
            }
            if (capture.status === ChildProgramStatus.LIVE) {
                liveCaptures.push((<CapturePanel title={name} capture={capture} />));
            } else {
                pastCaptures.push((<CapturePanel title={name} capture={capture} />));
            }
         }
      }
      return (
         <div>
            <nav>
               <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                  <li className="breadcrumb-item active">Dashboard</li>
               </ol>
            </nav>

            <div className="container">
               <div className="row">
                  <div className="col-xs-12">
                     <h1>Environment Dashboard</h1>
                  </div>
               </div>
               <br></br>
               <div className="row">
                  <div className="col-xs-12 col-md-6 mb-r">
                     <div>
                        <h2 style={{display: "inline"}}>Captures</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                           data-target="#captureModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <CaptureModal id="captureModal"/>
                     </div>
                     {liveCaptures.length === 0 ? null : <h4>Live</h4>}
                     {liveCaptures}
                     <br></br>
                     {pastCaptures.length === 0 ? null : <h4>Past</h4>}
                     {pastCaptures}
                     <br></br>
                  </div>
                  <div className="col-xs-12 col-md-6 mb-r">
                     <div>
                        <h2 style={{display: "inline"}}>Replays</h2>
                        <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                            data-target="#replayModal" style={{marginBottom: "12px", marginLeft: "12px"}}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                        </a>
                        <ReplayModal id="replayModal" captures={this.state.captures}/>
                     </div>
                     <br></br>
                     <h4>Past</h4>
                     <ReplayPanel title="Lil Replay" />
                     <ReplayPanel title="Sample Replay #2" />
                     <ReplayPanel title="Sample Replay #3" />
                     <br></br>
                  </div>
               </div>

            </div>
         </div>
      );
   }
}

ReactDom.render(<DashboardApp />, document.getElementById('dashboard-app'));
