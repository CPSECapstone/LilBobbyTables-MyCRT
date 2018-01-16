import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

import { ReplayPanel } from './components/replay_panel_comp';

const CaptureApp = () => {
   return (
        <div>
            <ol className="breadcrumb">
                <li><a href="./environments">Environments</a></li>
                <li><a href="./dashboard">Dashboard</a></li>
                <li className="active">Capture</li>
            </ol>
           <div className="page-header myCRT-page-header">
                <h1>Capture Name</h1>
                <p><a className="btn btn-primary" href="/metrics" role="button">Compare Metrics</a></p>
           </div>
           <div className="modal-body row">
               <div className="col-md-6">
                    <div className="page-header">
                        <h2>Replays</h2>
                    </div>
                    <ReplayPanel title="Lil Replay #1"/>
                    <ReplayPanel title="Sample Replay #2"/>
                    <ReplayPanel title="Sample Replay #3"/>
                    <ReplayPanel title="Sample Replay #4"/>
                    <ReplayPanel title="Sample Replay #5"/>
                    <ReplayPanel title="Sample Replay #6"/>
                </div>
            </div>
        </div>
   );
};

ReactDom.render(<CaptureApp />, document.getElementById('capture-app'));
