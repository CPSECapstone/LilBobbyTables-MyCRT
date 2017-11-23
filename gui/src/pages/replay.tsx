import '../../static/css/replay.css';

import React = require('react');
import ReactDom = require('react-dom');

const ReplayApp = () => {
   return (
      <div className="replay-style-test">
         <p>Hello from replay.tsx</p>

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

ReactDom.render(<ReplayApp />, document.getElementById('replay-app'));
