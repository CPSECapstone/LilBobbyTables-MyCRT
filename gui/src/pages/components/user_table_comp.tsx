import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { BrowserLogger as logger } from '../../logging';
import { ErrorModal } from './error_modal_comp';

export class UserTable extends React.Component<any, any> {
   public constructor(props: any) {
     super(props);
   }

   public render() {
      return (
         <table className="table">
            <thead className="thead-light">
               <tr>
                  <th scope="col">#</th>
                  <th scope="col">Email</th>
                  <th scope="col">Admin Access</th>
                  <th scope="col">Date Joined</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <th scope="row">1</th>
                  <td>hilaryschulz@gmail.com</td>
                  <td>true</td>
                  <td>5/5/18</td>
               </tr>
               <tr>
                  <th scope="row">2</th>
                  <td>ctaylo36@calpoly.edu</td>
                  <td>false</td>
                  <td>5/18/18</td>
               </tr>
               <tr>
                  <th scope="row">3</th>
                  <td>hils124@yahoo.com</td>
                  <td>false</td>
                  <td>5/19/18</td>
               </tr>
            </tbody>
         </table>
      );
   }
}
