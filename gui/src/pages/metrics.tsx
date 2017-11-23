import '../../static/css/metrics.css';

import React = require('react');
import ReactDom = require('react-dom');

const MetricsApp = () => {
   return (
      <div className="metrics-style-test">
         <p>Hello from metrics.tsx</p>

         <ul>
            <li>and</li>
            <li>this</li>
            <li>is</li>
            <li>a</li>
            <li>list</li>
         </ul>
      </div>
   );
};

ReactDom.render(<MetricsApp />, document.getElementById('metrics-app'));
