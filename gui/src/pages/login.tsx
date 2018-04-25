import './common';

import '../../static/css/login.css';

import { BrowserLogger as logger } from './../logging';
import { style, validLoginFields } from './utils/auth';
import { mycrt } from './utils/mycrt-client';

import * as React from 'react';
import * as ReactDom from 'react-dom';

export interface State {
   email: string;
   password: string;
}

class LoginApp extends React.Component<{}, State> {

   constructor(props: {}) {
      super(props);
      this.state = {
         email: '',
         password: '',
      };
   }

   public render() {
      return (
         <div className="container">
            <div className="row">
               <div className="col-12 text-center">

                  <div className="card text-center" style={style.signupCard}>
                     <div className="card-body">
                        <h3 style={style.cardTitle}>Login to MyCRT</h3>

                        <div className="input-group mb-3">
                           <input type="email" className="form-control" placeholder="email"
                              onChange={this.handleEmailChange}/>
                        </div>
                        <div className="input-group mb-3">
                           <input type="password" className="form-control"
                              placeholder="password" onChange={this.handlePasswordChange} />
                        </div>
                        <div className="input-group mb-3">
                           <button type="button" className="btn btn-primary" style={style.submit}
                                 onClick={this.handleSubmit}>
                              Log In
                           </button>
                        </div>

                     </div>
                  </div>

                  <p className="text-muted">
                     Need to create an account? <a href="/signup">Sign Up</a>
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

   private handlePasswordChange = (e: any) => {
      this.setState({
         ...this.state,
         password: e.target.value,
      });
   }

   private handleSubmit = async (e: any) => {
      logger.info("Submit!");
      const valid = validLoginFields(this.state);

      const user = await mycrt.login(this.state);

      if (!valid || user === null) {
         logger.error("Invalid Credentials");
      } else {
         logger.info("Done!");
         window.location.assign('/');
      }
   }

}

ReactDom.render(<LoginApp />, document.getElementById('login-app'));
