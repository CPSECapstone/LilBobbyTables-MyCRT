import './common';

import '../../static/css/environments.css';

import React = require('react');
import ReactDom = require('react-dom');

import { EnvironmentPanel } from './components/env_panel_comp';
import { EnvModal } from './components/environment_modal_comp';

const EnvironmentsApp = () => {
   return (
    <div>
      <nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item active"><a>Environments</a></li>
        </ol>
      </nav>
      <div className="container">
        <div className="row">
          <div className="col-sm-12 mb-r">
            <div className="page-header">
              <h1 style={{ display: "inline"}}>Environments</h1>
              <a role="button" className="btn btn-primary" data-toggle="modal" href="#"
                  data-target="#envModal" style={{ marginBottom: "20px", marginLeft: "15px" }}>
                  <i className="fa fa-plus" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </div>
        <br></br>
        <div className="row">
          <div className="col-sm-12 mb-r">
              <EnvModal id="envModal" />
            <EnvironmentPanel title="Lil Environment #1" />
            <EnvironmentPanel title="Sample Environment #2" />
            <EnvironmentPanel title="Sample Environment #3" />
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDom.render(<EnvironmentsApp />, document.getElementById('environments-app'));
