import './common';

import '../../static/css/index.css';

import { BrowserLogger as logger } from '../logging';

import React = require('react');
import ReactDom = require('react-dom');

import { BasePage } from './components/base_page_comp';
import { mycrt } from './utils/mycrt-client'; // client for interacting with the service

const IndexApp = () => {
    return (
        <div className="jumbotron jumbotron-fluid">
            <div className="container">
                <h1 className="display-3">MyCRT</h1>
                <p className="lead">Amazon Web Services</p>
                <p><a className="btn btn-primary btn-lg" href="/environments" role="button">Get Started</a></p>
            </div>
        </div>
    );
 };

ReactDom.render(<BasePage page={<IndexApp />}/>, document.getElementById('index-app'));
