import '../utils/errors';

import React = require('react');
import ReactDom = require('react-dom');
import { Provider } from 'react-redux';

import * as $ from 'jquery';

import { showAlert } from '../../actions';
import { Alert } from '../../components/alert';
import { BrowserLogger as logger } from '../../logging';
import { store } from '../../store';
import { mycrt } from '../utils/mycrt-client';
import { NavBar } from './nav_bar_comp';

export interface State {
   loggedIn: boolean;
}

export class BasePage extends React.Component<any, State> {

   public constructor(props: any) {
      super(props);
      this.state = {
         loggedIn: false,
      };
   }

   public async componentDidMount() {
      const user = await mycrt.aboutMe();
      this.setState({ loggedIn: !user });
   }

   public componentDidCatch(error: Error, info: React.ErrorInfo) {
      logger.error(error.message);
      logger.error(info.componentStack);
      store.dispatch(showAlert({
         show: true,
         header: "An Unexpected Error Occurred",
         message: error.message,
      }));
   }

   public render() {
      return (
         <Provider store={store} >
            <div>
               <NavBar loggedIn={this.state.loggedIn} />
               <Alert />
               {this.props.page}
            </div>
         </Provider>
      );
   }
}
