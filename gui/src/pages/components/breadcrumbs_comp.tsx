import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { ChildProgramStatus } from '@lbt-mycrt/common/dist/data';

export class Breadcrumbs extends React.Component<any, any>  {

   public render() {
      return (
         <nav>
            <ol className="breadcrumb">
               <li className="breadcrumb-item"><a href="./environments">Environments</a></li>
               <li className="breadcrumb-item">
                  <a href={`./dashboard?id=${this.props.capture.envId}`}>{this.props.env.envName}</a></li>
               <li className="breadcrumb-item active">{this.props.capture.name}</li>
            </ol>
         </nav>
      );
   }
}
