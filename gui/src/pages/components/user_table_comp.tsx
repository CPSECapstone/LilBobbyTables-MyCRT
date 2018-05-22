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
      const users: JSX.Element[] = [];
      let count = 1;
      for (const user of this.props.users) {
         users.push(
            <tr>
               <th scope="row">{count}</th>
               <td>{user.username}</td>
               <td>{String(user.isAdmin)}</td>
               <td>{user.acceptedAt}</td>
            </tr>,
         );
         count += 1;
      }
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
            <tbody>{users}</tbody>
         </table>
      );
   }
}
