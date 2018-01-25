import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

import { ReplayPanel } from './components/replay_panel_comp';

import { mycrt } from './utils/mycrt-client';

class CaptureApp extends React.Component<any, any> {

   public constructor(props: any) {
      super(props);

      // FIXME: THIS IS A QUICK AND DIRTY WAY TO DO THIS

      let id: any = null;
      const match = window.location.search.match(/.*\?.*id=(\d+)/);
      if (match) {
         id = match[1];
      }

      this.state = {
         captureId: id,
         capture: null,
      };
   }

   public async componentWillMount() {
      if (this.state.captureId) {
         this.setState({
            capture: await mycrt.getCapture(this.state.captureId),
         });
      }
   }

   public render() {
      const metricsTarget = `./metrics?id=${this.state.captureId}`;
      return (
         <div>
            <nav>
               <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
                  <li className="breadcrumb-item"><a href="./dashboard">Dashboard</a></li>
                  <li className="breadcrumb-item active">Capture</li>
               </ol>
            </nav>

            <div className="container">
               <div className="row">
                  <div className="col-sm-12 mb-r">

                     <div className="page-header">
                        <h1>Capture { this.state.captureId }</h1>
                        <a role="button" href={metricsTarget} className="btn btn-primary">
                           <i className="fa fa-line-chart" aria-hidden="true"></i> Compare Metrics
                     </a>
                     </div>
                     <div className="modal-body">
                        <div className="page-header">
                           <h2>Replays</h2>
                        </div>
                        <div className="card-columns">
                           <ReplayPanel title="Lil Replay #1" />
                           <ReplayPanel title="Sample Replay #2" />
                           <ReplayPanel title="Sample Replay #3" />
                           <ReplayPanel title="Sample Replay #4" />
                           <ReplayPanel title="Sample Replay #5" />
                           <ReplayPanel title="Sample Replay #6" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

}

ReactDom.render(<CaptureApp />, document.getElementById('capture-app'));
