import './common';

import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

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
        </div>
   );
};

ReactDom.render(<CaptureApp />, document.getElementById('capture-app'));
