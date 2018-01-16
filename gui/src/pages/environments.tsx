import './common';

import '../../static/css/environments.css';

import React = require('react');
import ReactDom = require('react-dom');

import { EnvironmentPanel } from './components/env_panel_comp';

const EnvironmentsApp = () => {
   return (
       <div>
           <div className="page-header myCRT-page-header">
                <h1>Environments</h1>
            </div>
           <EnvironmentPanel title="Lil Environment #1"/>
           <EnvironmentPanel title="Sample Environment #2"/>
           <EnvironmentPanel title="Sample Environment #3"/>
       </div>
   );
};

ReactDom.render(<EnvironmentsApp />, document.getElementById('environments-app'));
