import React = require('react');
import ReactDom = require('react-dom');

export class Duration extends React.Component<any, any>  {

   public constructor(props: any) {
      super(props);
      this.handleTimeChange = this.handleTimeChange.bind(this);
   }

   public handleTimeChange(event: any) {
      const duration = event.currentTarget.value;
      this.props.update(parseInt(duration));
   }

   public render() {
      return (
         <div className="col-3">
            <input className="form-control" type="number" value={this.props.value}
               defaultValue={this.props.constraint ? '5' : '0'}
               min={this.props.constraint ? '5' : '0'}
               onChange={this.handleTimeChange}/>
            <label style={{paddingLeft: "25px"}}>{this.props.type}</label>
         </div>
      );
   }
}
