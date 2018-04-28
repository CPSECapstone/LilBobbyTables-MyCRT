import './common';

import '../../static/css/account.css';

import * as React from 'react';
import * as ReactDom from 'react-dom';

import { IUser } from '@lbt-mycrt/common';

import { BrowserLogger as logger } from './../logging';
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
            <h1>Account Page</h1>
            <UserInfo email={this.state.user.email} />
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
