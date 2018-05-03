import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

export class NavBar extends React.Component<any, any> {
   public constructor(props: any) {
     super(props);
     this.state = {};
   }

   public render() {
      if (this.props.loggedIn === null) {
         return <div></div>;
      }
      return (
         <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <a className="navbar-brand" href="./environments">
            <i className="fa fa-database fa-2x" aria-hidden="true"></i>&nbsp; MyCRT
            </a>
            <div className="collapse navbar-collapse" id="navbarNav">
               <ul className="navbar-nav mr-auto"></ul>
               <ul className="navbar-nav">
                  {this.props.loggedIn ?
                     <li className="nav-item myCRT-nav">
                        <a href="/signup" className="nav-link">Sign Up</a>
                     </li> :
                     <li className="nav-item myCRT-nav">
                        <a href="./environments" className="nav-link">Home</a>
                     </li> }
                  {this.props.loggedIn ?
                     <li className="nav-item myCRT-nav">
                        <a href="/login" className="nav-link">Login</a>
                     </li> :
                     <li className="nav-item myCRT-nav">
                        <a href="/account" className="nav-link">Account</a>
                     </li>
                  }
                  <li className="nav-item myCRT-nav">
                  <a className="nav-link" target="_blank" href="https://goo.gl/forms/ZW3UzeoiEXSc5ifz1">Feedback</a>
                  </li>
                  <li className="nav-item myCRT-nav">
                  <a className="nav-link" target="_blank"
                     href="https://lilbobbytables.gitbook.io/mycrt-user-guide/">Help</a>
                  </li>
               </ul>
            </div>
         </nav>
      );
   }
}
