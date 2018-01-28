import './common';

import '../../static/css/environments.css';

import React = require('react');
import ReactDom = require('react-dom');

import { EnvironmentPanel } from './components/env_panel_comp';

const EnvironmentsApp = () => {
   return (
      <div className="container">
         <div className="row">
            <div className="col-sm-12 mb-r">
               <div className="page-header">
                  <h1 style={{display: "inline"}}>Environments</h1>
                  <a role="button" className="btn btn-primary" href="#"
                     style={{marginBottom: "20px", marginLeft: "15px"}}>
                    <i className="fa fa-plus" aria-hidden="true"></i>
                  </a>
               </div>
               <EnvironmentPanel title="Lil Environment #1" />
               <EnvironmentPanel title="Sample Environment #2" />
               <EnvironmentPanel title="Sample Environment #3" />
            </div>
         </div>
      </div>
   );
};

ReactDom.render(<EnvironmentsApp />, document.getElementById('environments-app'));
