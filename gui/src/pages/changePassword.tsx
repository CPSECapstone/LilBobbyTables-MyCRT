import './common';

import '../../static/css/signup.css';
import { showAlert } from '../actions';
import { store } from '../store';
import { BrowserLogger as logger } from './../logging';
import { BasePage } from './components/base_page_comp';
import { style, validChangePasswordFields } from './utils/auth';
import { mycrt } from './utils/mycrt-client';

import * as React from 'react';
import * as ReactDom from 'react-dom';

export interface State {
   email: string | undefined;
   oldPassword: string;
   password: string;
   confirmPassword: string;
}

class ChangePasswordApp extends React.Component<{}, State> {

   constructor(props: {}) {
      super(props);
      this.state = {
         email: undefined,
         oldPassword: '',
         password: '',
         confirmPassword: '',
      };
   }
   public async componentDidMount() {
      const me = await mycrt.aboutMe();
      if (me) {
         this.setState({
            email: me.email,
         });
      } else {
         logger.error("Failed to load user data");
      }
   }

   public render() {
      return (
         <div className="container">
            <div className="row">
               <div className="col-12 text-center">

                  <div className="card text-center myCRT-setup-card" style={style.signupCard}>
                     <div className="card-body">
                        <h3 style={style.cardTitle}>Change Password</h3>

                        <div className="input-group mb-3">
                           <input type="password" className="form-control" placeholder="Old Password"
                              value={this.state.oldPassword} onChange={this.handleOldPasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <input type="password" className="form-control" placeholder="New Password"
                              value={this.state.password} onChange={this.handlePasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <input type="password" className="form-control"
                              placeholder="Confirm New Password" value={this.state.confirmPassword}
                              onChange={this.handleConfirmPasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <button type="button" className="btn btn-primary" style={style.submit}
                                 onClick={this.changePassword}>
                              Change Password
                           </button>
                        </div>

                     </div>
                  </div>

                  <p className="text-muted">
                     <a href="/account">Cancel</a>
                  </p>

               </div>
            </div>
         </div>
      );
   }

   private handleOldPasswordChange = (e: any) => {
      this.setState({
         ...this.state,
         oldPassword: e.target!.value,
      });
   }

   private handlePasswordChange = (e: any) => {
      this.setState({
         ...this.state,
         password: e.target.value,
      });
   }

   private handleConfirmPasswordChange = (e: any) => {
      this.setState({
         ...this.state,
         confirmPassword: e.target.value,
      });
   }

   private changePassword = async (e: any) => {
      logger.info("Change password!");
      const valid = validChangePasswordFields(this.state);

      if (!valid) {
         logger.info("Showing alert");
         store.dispatch(showAlert({
            show: true,
            header: "Bad Password",
            message: "Please enter a new password. The password must be between 8 and 64 characters.",
         }));
         return;
      }

      const user = await mycrt.changePassword({
         oldPassword: this.state.oldPassword,
         newPassword: this.state.password,
         newPasswordAgain: this.state.confirmPassword,
      });

      if (!valid || user === null) {
         logger.error("Invalid Credentials");
         store.dispatch(showAlert({
            show: true,
            header: "Bad Password",
            message: "The password you entered did not match the password on file. "
               + "Please re-enter your old password.",
         }));
      } else {
         logger.info("Done!");
         logger.info(JSON.stringify(user));
         window.location.assign('/');
      }
   }

}

ReactDom.render(<BasePage page={<ChangePasswordApp />}/>, document.getElementById('changePassword-app'));
