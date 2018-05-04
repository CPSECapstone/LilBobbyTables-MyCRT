import React = require('react');
import ReactDom = require('react-dom');

import { BrowserLogger as logger } from '../../logging';
import { Pagination } from './pagination_comp';
import { Search } from './search_comp';

export class ListView extends React.Component<any, any>  {

   constructor(props: any) {
      super(props);
      this.state = {arrow: "right", collapsed: true};
      this.updateCollapse = this.updateCollapse.bind(this);
   }

   public filterSearch(text: string) {
      return (val: any) => val.props.title.toLowerCase().search(text.toLowerCase()) >= 0;
   }

   public updateCollapse() {
      if (this.state.arrow === "right") {
         this.setState({arrow: "down", collapsed: false});
      } else {
         this.setState({arrow: "right", collapsed: true});
      }
   }

   public render() {
      if (this.props.list === null) {return <div></div>; }
      return (
         <div>
            <div className="card">
               <div className="myCRT-collapse-header card-header" role="tab" id="headingOne">
                  <span className="collapse-card-title" data-toggle="collapse"
                     style={{cursor: "pointer"}}
                     data-target={`#${this.props.type}`} onClick={this.updateCollapse}>
                     <i className={`fa fa-angle-${this.state.arrow} fa-2x`} style={{paddingRight: "10px"}}></i>
                  </span>
                  <h4 style={{padding: "0px", display: "inline-block"}}>{this.props.name}</h4>
                  <h5 style={{padding: "0px", display: "inline-block"}}>&nbsp;({this.props.list.length})</h5>
                  {this.state.collapsed ? <div></div> :
                     <Search length={this.props.list.length} type={this.props.type} update={this.props.update}/>}
               </div>
               <div className="collapse myCRT-collapse-body" id={this.props.type}>
                  <div className="card-block">
                     {this.props.list.length ? <Pagination
                        list={this.props.list.filter(this.filterSearch(this.props.stateVar))}
                        limit={4}/> :
                        <p className="myCRT-empty-col">{this.props.display}</p>}
                  </div>
                  <br/>
               </div>
            </div>
            <br></br>
         </div>
      );
   }
}
