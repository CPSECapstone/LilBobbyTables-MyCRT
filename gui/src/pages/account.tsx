import './common';

import '../../static/css/account.css';

import * as React from 'react';
import * as ReactDom from 'react-dom';

import { IUser } from '@lbt-mycrt/common';

import { BrowserLogger as logger } from './../logging';
import { BasePage } from './components/base_page_comp';
import { mycrt } from './utils/mycrt-client';

interface State {
   user: IUser;
}

function UserInfo(props: {email?: string}): JSX.Element {
   if (props.email) {
      return <div><p>email: {props.email} </p></div>;
   } else {
      return <div><p>Loading User Info...</p></div>;
   }
}

class AccountApp extends React.Component<{}, State> {

   constructor(props: {}) {
      super(props);
      this.state = {
         user: {
            email: undefined,
         },
      };
   }

   public async componentDidMount() {
      const me = await mycrt.aboutMe();
      if (me) {
         this.setState({
            user: {
               email: me.email,
            },
         });
      } else {
         logger.error("Failed to load user data");
      }
   }

   public render() {
      return (
         <div>
            <nav>
               <ol className="breadcrumb">
                  <li className="breadcrumb-item active"><a>Account</a></li>
               </ol>
            </nav>
            <div className="container">
               <div className="row">
                  <div className="col-sm-12 mb-r">
                  <div className="page-header">
                     <h1 style={{ display: "inline"}}>My Account</h1>
                  </div>
                  <br/>
                  <UserInfo email={this.state.user.email} />
                     <button type="button" className="btn btn-outline-danger" onClick={this.handleChangePassword}>
                        Change Password
                     </button>
                     <button type="button" className="btn btn-outline-danger" onClick={this.handleSignout}>
                        Logout
                     </button>
                  </div>
               </div>
               <br/>
            </div>
         </div>
      );
   }

   private handleChangePassword = async (e: any) => {
      window.location.assign('/changePassword');
   }

   private handleSignout = async (e: any) => {
      const logout = await mycrt.logout();
      window.location.assign('/login');
   }

}

ReactDom.render(<BasePage page={<AccountApp />}/>, document.getElementById('account-app'));
