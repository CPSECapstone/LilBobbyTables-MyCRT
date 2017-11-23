import '../../static/css/environment.css';

import React = require('react');
import ReactDom = require('react-dom');

const EnvironmentApp = () => {
   return (
      <div className="environment-style-test">
         <p>Hello from environment.tsx</p>
      </div>
   );
};

ReactDom.render(<EnvironmentApp />, document.getElementById('environment-app'));
