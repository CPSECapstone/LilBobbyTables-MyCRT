import '../../static/css/capture.css';

import React = require('react');
import ReactDom = require('react-dom');

const CaptureApp = () => {
   return (
      <div className="capture-style-test">
         <p>this is capture.tsx</p>
      </div>
   );
};

ReactDom.render(<CaptureApp />, document.getElementById('capture-app'));
