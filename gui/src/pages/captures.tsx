import '../../static/css/captures.css';

import React = require('react');
import ReactDom = require('react-dom');

const CapturesApp = () => {
   return (
      <div className="captures-style-test">
         <ol>
            <li>an</li>
            <li>ordered</li>
            <li>list</li>
         </ol>
      </div>
   );
};

ReactDom.render(<CapturesApp />, document.getElementById('captures-app'));
