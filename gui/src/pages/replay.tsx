import './common';

import '../../static/css/replay.css';

import React = require('react');
import ReactDom = require('react-dom');

const ReplayApp = () => {
   return (
        <div>
            <ol className="breadcrumb">
                <li><a href="./environments">Environments</a></li>
                <li><a href="./dashboard">Dashboard</a></li>
                <li className="active">Replay</li>
            </ol>
           <div className="page-header myCRT-page-header">
                <h1>Replay Name</h1>
            </div>
        </div>
   );
};

ReactDom.render(<ReplayApp />, document.getElementById('replay-app'));
