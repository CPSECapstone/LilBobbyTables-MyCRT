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
            <ol className="breadcrumb">
                <li><a href="./environments">Environments</a></li>
                <li className="active">Dashboard</li>
            </ol>
            <div className="page-header myCRT-page-header">
                <h1>Environment Dashboard</h1>
            </div>
            <div className="modal-body row">
                <div className="col-md-6">
                    <div className="page-header">
                        <h2>Captures</h2>
                    </div>
                    <CapturePanel title="Lil Capture"/>
                    <CapturePanel title="Sample Capture #2"/>
                    <CapturePanel title="Sample Capture #3"/>
                </div>
                <div className="col-md-6">
                    <div className="page-header">
                        <h2>Replays</h2>
                    </div>
                    <ReplayPanel title="Lil Replay"/>
                    <ReplayPanel title="Sample Replay #2"/>
                    <ReplayPanel title="Sample Replay #3"/>
                </div>
            </div>

            {/* <h1 style={{"text-align": "center"}}>Environment Dashboard</h1> */}
        </div>
    );
 };

ReactDom.render(<DashboardApp />, document.getElementById('dashboard-app'));
