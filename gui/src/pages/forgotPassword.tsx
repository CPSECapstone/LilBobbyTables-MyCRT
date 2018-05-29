import './common';

import '../../static/css/login.css';

import { showAlert } from '../actions';
import { store } from '../store';
import { BrowserLogger as logger } from './../logging';
import { BasePage } from './components/base_page_comp';
import { style, validLoginFields } from './utils/auth';
import { mycrt } from './utils/mycrt-client';

import * as React from 'react';
import * as ReactDom from 'react-dom';

export interface State {
   email: string;
}

class ForgotPasswordApp extends React.Component<{}, State> {

   constructor(props: {}) {
      super(props);
      this.state = {
         email: '',
      };
   }

   public render() {
      return (
         <div className="container">
            <div className="row">
               <div className="col-12 text-center">

                  <div className="card text-center myCRT-setup-card" style={style.signupCard}>
                     <div className="card-body">
                        <h3 style={style.cardTitle}>Forgot Password</h3>

                        <div className="input-group mb-3">
                           <input type="email" className="form-control" placeholder="Email"
                              onChange={this.handleEmailChange}/>
                        </div>
                        <div className="input-group mb-3">
                           <button type="button" className="btn btn-primary" style={style.submit}
                                 onClick={this.recoverLogin}>
                              Send Reset Link
                           </button>
                        </div>
                     </div>
                  </div>

                  <p className="text-muted">
                     Remember your password? <a href="/login">Login</a>
                  </p>

               </div>
            </div>
         </div>
      );
   }

   private handleEmailChange = (e: any) => {
      this.setState({
         ...this.state,
         email: e.target.value,
      });
   }

   private recoverLogin = async (e: any) => {
      logger.info("Need to reset password!");
      const body = {
         email: this.state.email,
      };
      const user = mycrt.forgotPassword(body);

      logger.info("Check that the email belongs to a valid user");
      // TODO: Check that the email is valid and is registered to a user in the db
      // const valid = null;

      // if (!valid || user === null) {
      //    logger.error("Invalid Email");
      //    store.dispatch(showAlert({
      //       show: true,
      //       header: "Invalid Email",
      //       message: "The provided email is not registered with MyCRT.",
      //    }));
      // } else {
      //    logger.info("Done!");
      //    // window.location.assign('/');
      // }
   }

}

ReactDom.render(<BasePage page={<ForgotPasswordApp />}/>, document.getElementById('forgotPassword-app'));
