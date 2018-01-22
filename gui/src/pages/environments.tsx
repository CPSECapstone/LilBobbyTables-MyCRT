import './common';

import '../../static/css/environments.css';

import React = require('react');
import ReactDom = require('react-dom');

import { EnvironmentPanel } from './components/env_panel_comp';

const EnvironmentsApp = () => {
   return (
      <div className="container">
         <div className="row">
            <div className="col-xs-12">

               <div className="page-header">
                  <h1>Environments</h1>
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
