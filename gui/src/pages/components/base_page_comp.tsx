import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { BrowserLogger as logger } from '../../logging';
import { mycrt } from '../utils/mycrt-client';
import { NavBar } from './nav_bar_comp';

export class BasePage extends React.Component<any, any> {
   public constructor(props: any) {
     super(props);
     this.state = {loggedIn: false};
   }

   public async componentWillMount() {
      const user = await mycrt.aboutMe();
      this.setState({loggedIn: !user});
   }

   public render() {
      return (
         <div>
            <NavBar loggedIn={this.state.loggedIn}/>
            {this.props.page}
         </div>
      );
   }
}
