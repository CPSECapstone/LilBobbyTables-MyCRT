import './common';

import '../../static/css/signup.css';
import { showAlert } from '../actions';
import { store } from '../store';
import { BrowserLogger as logger } from './../logging';
import { BasePage } from './components/base_page_comp';
import { style, validSignupFields } from './utils/auth';
import { mycrt } from './utils/mycrt-client';

import * as React from 'react';
import * as ReactDom from 'react-dom';

export interface State {
   email: string;
   password: string;
   confirmPassword: string;
}

class SignupApp extends React.Component<{}, State> {

   constructor(props: {}) {
      super(props);
      this.state = {
         email: '',
         password: '',
         confirmPassword: '',
      };
   }

   public render() {
      return (
         <div className="container">
            <div className="row">
               <div className="col-12 text-center">

                  <div className="card text-center myCRT-setup-card" style={style.signupCard}>
                     <div className="card-body">
                        <h3 style={style.cardTitle}>Create a MyCRT Account</h3>

                        <div className="input-group mb-3">
                           <input type="email" className="form-control" placeholder="Email"
                              value={this.state.email} onChange={this.handleEmailChange} />
                        </div>
                        <div className="input-group mb-3">
                           <input type="password" className="form-control" placeholder="Password"
                              value={this.state.password} onChange={this.handlePasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <input type="password" className="form-control"
                              placeholder="Confirm Password" value={this.state.confirmPassword}
                              onChange={this.handleConfirmPasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <button type="button" className="btn btn-primary" style={style.submit}
                                 onClick={this.handleSubmit}>
                              Create Account
                           </button>
                        </div>

                     </div>
                  </div>

                  <p className="text-muted">Already have an account? <a href="/login">Login</a></p>

               </div>
            </div>
         </div>
      );
   }

   private handleEmailChange = (e: any) => {
      this.setState({
         ...this.state,
         email: e.target!.value,
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

   private handleSubmit = async (e: any) => {
      logger.info("Submit!");
      const valid = validSignupFields(this.state);

      if (!valid) {
         logger.info("Showing alert");
         store.dispatch(showAlert({
            show: true,
            header: "Bad Email/Password",
            message: "Please enter an email and password. The password must be between 8 and 64 characters.",
         }));
         return;
      }

      const user = await mycrt.signup({
         email: this.state.email,
         password: this.state.password,
         agreeToTerms: true,
      });

      if (!valid || user === null) {
         logger.error("Invalid Credentials");
      } else {
         logger.info("Done!");
         logger.info(JSON.stringify(user));
         window.location.assign('/login');
      }
   }

}

ReactDom.render(<BasePage page={<SignupApp />}/>, document.getElementById('signup-app'));
