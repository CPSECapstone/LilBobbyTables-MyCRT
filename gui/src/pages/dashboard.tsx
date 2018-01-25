import React = require('react');
import ReactDom = require('react-dom');

import { IChildProgram } from '@lbt-mycrt/common/dist/data';

import './common';

import '../../static/css/index.css';

import { BrowserLogger as logger } from '../logging';
import { CapturePanel } from './components/capture_panel_comp';
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
      const captures: JSX.Element[] = [];
      if (this.state.captures) {
         for (const capture of this.state.captures) {
            const name = `capture ${capture.id}`;
            captures.push((<CapturePanel title={name} id={capture.id} />));
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
               <div className="row">
                  <div className="col-xs-12 col-md-6 mb-r">
                     <div>
                        <h2>Captures</h2>
                     </div>
                     {captures}
                  </div>
                  <div className="col-xs-12 col-md-6 mb-r">
                     <div>
                        <h2>Replays</h2>
                     </div>
                     <ReplayPanel title="Lil Replay" />
                     <ReplayPanel title="Sample Replay #2" />
                     <ReplayPanel title="Sample Replay #3" />
                  </div>
               </div>

            </div>
         </div>
      );
   }
}

ReactDom.render(<DashboardApp />, document.getElementById('dashboard-app'));
