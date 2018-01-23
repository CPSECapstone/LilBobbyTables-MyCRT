import './common';

import '../../static/css/index.css';

import { BrowserLogger as logger } from '../logging';

import React = require('react');
import ReactDom = require('react-dom');

import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

import { CapturePanel } from './components/capture_panel_comp';
import { ReplayPanel } from './components/replay_panel_comp';

const DashboardApp = () => {
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

                  <CapturePanel title="Lil Capture" />
                  <CapturePanel title="Sample Capture #2" />
                  <CapturePanel title="Sample Capture #3" />
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
};

ReactDom.render(<DashboardApp />, document.getElementById('dashboard-app'));
