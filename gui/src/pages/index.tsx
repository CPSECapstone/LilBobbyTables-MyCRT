import '../../static/css/index.css';

import React = require('react');
import ReactDom = require('react-dom');

const IndexApp = () => {
   return (
      <div>
         <p>Hello from index.tsx</p>

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

ReactDom.render(<IndexApp />, document.getElementById('react-test-app'));
