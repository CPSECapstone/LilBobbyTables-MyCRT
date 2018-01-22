import './common';

import '../../static/css/replay.css';

import React = require('react');
import ReactDom = require('react-dom');

const ReplayApp = () => {
   return (
      <div>
         <nav>
            <ol className="breadcrumb">
               <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
               <li className="breadcrumb-item"><a href="./dashboard">Dashboard</a></li>
               <li className="breadcrumb-item active">Replay</li>
            </ol>
         </nav>

         <div className="container">
            <div className="row">
               <div className="col-xs-12">

                  <div className="page-header">
                     <h1>Replay Name</h1>
                  </div>

               </div>
            </div>
         </div>
      </div>
   );
};

ReactDom.render(<ReplayApp />, document.getElementById('replay-app'));
