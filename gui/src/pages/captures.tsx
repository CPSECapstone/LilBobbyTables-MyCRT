import '../../static/css/captures.css';

import React = require('react');
import ReactDom = require('react-dom');

import { BasePage } from './components/base_page_comp';

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

ReactDom.render(<BasePage page={<CapturesApp />}/>, document.getElementById('captures-app'));
