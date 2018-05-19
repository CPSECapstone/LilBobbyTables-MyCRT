import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';

export class Pagination extends React.Component<any, any>  {

   constructor(props: any) {
      super(props);
      this.state = {page: 0, pageSize: this.props.limit, totalPages: 0};
      this.prevPage = this.prevPage.bind(this);
      this.nextPage = this.nextPage.bind(this);
   }

   public componentWillMount() {
      const totalPages = Math.ceil(this.props.list.length / this.state.pageSize);
      this.setState({totalPages});
   }

   public prevPage(event: any) {
      const oldPage = this.state.page;
      this.setState({page: oldPage - 1});
   }

   public nextPage(event: any) {
      const oldPage = this.state.page;
      this.setState({page: oldPage + 1});
   }

   public render() {
      if (this.props.list.length === 0) {
         return <p className="myCRT-empty-col">No matches according to your search.</p>; }
      const totalPages = Math.ceil(this.props.list.length / this.state.pageSize);
      const pages: JSX.Element[] = [];
      let prev = false;
      let next = false;
      // tslint:disable-next-line:prefer-for-of
      if (this.state.page > 0) {
         prev = true;
      }
      if (this.state.page < totalPages - 1) {
         next = true;
      }
      return (
         <div>
            {this.props.list.filter((_: any, index: number) =>
               Math.floor(index / this.state.pageSize) === this.state.page)}
            {totalPages > 1 ?
            <div style={{marginTop: "20px"}}>
               <button type="button" className={`btn btn-outline-primary float-left ${prev ? "" : "invisible"}`}
                  style={{marginLeft: "25px"}}
                  onClick={this.prevPage}>Previous</button>
               <button type="button" className={`btn btn-outline-primary float-right ${next ? "" : "invisible"}`}
                  style={{marginLeft: "20px", marginRight: "25px"}}
                  onClick={this.nextPage}>Next</button>
               {totalPages > 1 ?
                     <div style={{textAlign: "center", paddingTop: "10px"}}>
                        {this.state.page + 1} of {totalPages}</div> : null }
            </div> : null}
         </div>
      );
   }
}
