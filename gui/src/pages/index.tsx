import './common';

import '../../static/css/index.css';

import { BrowserLogger as logger } from '../logging';

import React = require('react');
import ReactDom = require('react-dom');

import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

const IndexApp = () => {
    return (
        <div className="jumbotron">
            <div className="container">
                <h1>MyCRT</h1>
                <p>Amazon Web Services</p>
                <p><a className="btn btn-primary btn-lg" href="/environments" role="button">Get Started</a></p>
            </div>
        </div>
    );
 };

ReactDom.render(<IndexApp />, document.getElementById('index-app'));
