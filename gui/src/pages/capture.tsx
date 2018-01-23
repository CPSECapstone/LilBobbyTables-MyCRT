import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

import { ReplayPanel } from './components/replay_panel_comp';

const CaptureApp = () => {
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
                     <h1>Capture Name</h1>
                     <a role="button" href="./metrics" className="btn btn-primary">
                        Compare Metrics
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
};

ReactDom.render(<CaptureApp />, document.getElementById('capture-app'));
