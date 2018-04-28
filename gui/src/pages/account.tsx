import './common';

import '../../static/css/account.css';

import { BrowserLogger as logger } from './../logging';
import { mycrt } from './utils/mycrt-client';

import * as React from 'react';
import * as ReactDom from 'react-dom';

class AccountApp extends React.Component {

   public render() {
      return (
         <div>
            <h1>Account Page</h1>
            <button type="button" className="btn btn-primary" onClick={this.handleSignout}>
               Signout
            </button>
         </div>
      );
   }

   private handleSignout = async (e: any) => {
      const logout = await mycrt.logout();
      window.location.assign('/login');
   }

}

ReactDom.render(<AccountApp />, document.getElementById('account-app'));
