import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { BrowserLogger as logger } from '../../logging';
import { ErrorModal } from './error_modal_comp';

export class ErrorBoundary extends React.Component<any, any> {
   public constructor(props: any) {
     super(props);
     this.state = {error: ""};
   }

   public componentDidCatch(error: any, info: any) {
      this.setState({error: info});
      $('#errorModal').modal('show');
   }

   public render() {
      return (
         <div>
            <ErrorModal id="errorModal" error={this.state.error}/>
            {this.props.children}
         </div>
      );
   }
}
