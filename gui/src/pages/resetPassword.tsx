import './common';

import '../../static/css/signup.css';
import { showAlert } from '../actions';
import { store } from '../store';
import { BrowserLogger as logger } from './../logging';
import { BasePage } from './components/base_page_comp';
import { style, validResetPasswordFields } from './utils/auth';
import { mycrt } from './utils/mycrt-client';

import * as React from 'react';
import * as ReactDom from 'react-dom';

export interface State {
   resetToken: string;
   newPassword: string;
   newPasswordAgain: string;
}

class ResetPasswordApp extends React.Component<{}, State> {

   constructor(props: {}) {
      super(props);

      let token: string = '';
      const match = window.location.search.match(/.*\?.*token=([a-f0-9]+)/);
      if (match) {
         token = match[1];
      }

      this.state = {
         resetToken: token,
         newPassword: '',
         newPasswordAgain: '',
      };
   }

   public render() {
      return (
         <div className="container">
            <div className="row">
               <div className="col-12 text-center">

                  <div className="card text-center myCRT-setup-card" style={style.signupCard}>
                     <div className="card-body">
                        <h3 style={style.cardTitle}>Reset Password</h3>

                        <div className="input-group mb-3">
                           <input type="password" className="form-control" placeholder="New Password"
                              value={this.state.newPassword} onChange={this.handlePasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <input type="password" className="form-control"
                              placeholder="Confirm New Password" value={this.state.newPasswordAgain}
                              onChange={this.handleConfirmPasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <button type="button" className="btn btn-primary" style={style.submit}
                                 onClick={this.resetPassword}>
                              Reset Password
                           </button>
                        </div>

                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   private handlePasswordChange = (e: any) => {
      this.setState({
         ...this.state,
         newPassword: e.target.value,
      });
   }

   private handleConfirmPasswordChange = (e: any) => {
      this.setState({
         ...this.state,
         newPasswordAgain: e.target.value,
      });
   }

   private resetPassword = async (e: any) => {
      logger.info("Reset password!");
      if (!this.state.resetToken) {
         logger.error("Invalid token!");
         store.dispatch(showAlert({
            show: true,
            header: "Invalid Token",
            message: "The token associated with this link was not found.",
         }));
         return;
      }

      const valid = validResetPasswordFields(this.state);
      if (!valid) {
         logger.error("Bad Password!");
         store.dispatch(showAlert({
            show: true,
            header: "Bad Password",
            message: "Please enter a new password. The password must be between 8 and 64 characters.",
         }));
         return;
      }

      logger.info(`reseting password! token is ${this.state.resetToken}`);
      const user = await mycrt.resetPassword(this.state);
      if (user === null) {
         store.dispatch(showAlert({
            show: true,
            header: "Error Reseting Password",
            message: "There was an error reseting the password. Please try again.",
         }));
      } else {
         logger.info("Password successfully reset!");
         window.location.assign('/login');
      }
   }

}

ReactDom.render(<BasePage page={<ResetPasswordApp />}/>, document.getElementById('resetPassword-app'));
