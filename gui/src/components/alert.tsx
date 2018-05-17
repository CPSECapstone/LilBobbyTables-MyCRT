import * as React from 'react';
import { connect } from 'react-redux';

import { hideAlert } from '../actions';
import { AlertState, PageState } from '../reducers';

export interface AlertProps extends AlertState {
   hideAlert: () => void;
}

const mapStateToProps = (state: PageState) => state.alert;

const mapDispatchToProps = (dispatch: any) => ({
   hideAlert: () => dispatch(hideAlert()),
});

class AlertComponent extends React.Component<AlertProps> {

   constructor(props: AlertProps) {
      super(props);
   }

   public render() {
      let type = "danger";
      if (this.props.success) {
         type = "success";
      }
      return (
         <div style={{
            position: 'absolute',
            top: '7em', right: '2em',
            width: '20em', zIndex: 99999,
         }} hidden={!this.props.show}>
            <div className={`card border-${type}`}>
               <div className={`card-header text-white bg-${type}`}>
                  {this.props.header || "Alert"}
                  <i className="fa fa-close" style={{
                     position: 'absolute', right: '1em', cursor: 'pointer',
                  }} onClick={this.props.hideAlert}></i>
               </div>
               <div className="card-body bg-light">
                  <div className="card-text"
                     dangerouslySetInnerHTML={{__html: this.props.message}}>
                  </div>
               </div>
            </div>
         </div>
      );
   }

}

export const Alert = connect(mapStateToProps, mapDispatchToProps)(AlertComponent);
