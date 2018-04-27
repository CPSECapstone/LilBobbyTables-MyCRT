import React = require('react');
import ReactDom = require('react-dom');

import * as $ from 'jquery';

import { BrowserLogger as logger } from '../../logging';
import { ErrorModal } from './error_modal_comp';

export class Search extends React.Component<any, any> {
   public constructor(props: any) {
     super(props);
     this.state = {search: false, searchText: ""};
     this.handleSearch = this.handleSearch.bind(this);
     this.searchText = this.searchText.bind(this);
   }

   public handleSearch(event: any) {
      const search = this.state.search;
      this.setState({search: !search, searchText: ""});
      this.props.update("", this.props.type);
   }

   public searchText(event: any) {
      const searchText = event.currentTarget.value;
      this.setState({searchText});
      this.props.update(searchText, this.props.type);
   }

   public render() {
      if (this.props.length === 0) {
         return (<div></div>);
      }
      return (
         <div className="input-group mb-3 myCRT-search" style={this.props.style}>
            <div className="input-group-append search-icon">
               <a role="button" className="btn btn-outline-secondary" onClick={this.handleSearch}
                  style={{borderRadius: "24px"}}>
                  <i className="fa fa-search" aria-hidden="true"></i></a>
            </div>
            <input type="text" className="form-control search-box" placeholder="Search"
               aria-label="Search" aria-describedby="basic-addon2" value={this.state.searchText}
               onChange={this.searchText}
               style={this.state.search ? {display: "block", WebkitTransition: "width 0.4s ease-in-out",
               transition: "width 0.4s ease-in-out", width: "50%", padding: "0.375rem 0.75rem",
                  border: "none", borderBottom: "1px solid #95a5a6"} : {}}/>
         </div>
      );
   }
}
