import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';
import { Pagination } from './pagination_comp';
import { Search } from './search_comp';

export class ListView extends React.Component<any, any>  {

   constructor(props: any) {
      super(props);
   }

   public filterSearch(text: string) {
      return (val: any) => val.props.title.toLowerCase().search(text.toLowerCase()) >= 0;
   }

   public render() {
      return (
         <div>
            <a style={{padding: "10px", display: "inline-block"}} data-toggle="collapse"
               href={`#${this.props.type}`}><h4>{this.props.name}</h4></a>
            <Search length={this.props.list.length} type={this.props.type} update={this.props.update}/>
            <br/>
            <div className="collapse myCRT-overflow-col" id={this.props.type}>
            {this.props.list.length ? <Pagination
               list={this.props.list.filter(this.filterSearch(this.props.stateVar))}
               limit={4}/> :
               <p className="myCRT-empty-col">{this.props.display}</p>}
            </div>
            <br></br>
         </div>
      );
   }
}
