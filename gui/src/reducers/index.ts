import { AnyAction } from 'redux';

import { ActionType } from '../actions';

export interface AlertState {
   show: boolean;
   header: string;
   message: string;
   success?: boolean;
}

export interface PageState {
   alert: AlertState;
}

const initialState: PageState = {
   alert: {
      show: false,
      header: "Alert from redux!",
      message: "Message!",
   },
};

export const rootReducer = (state: PageState = initialState, action: AnyAction): PageState => {
   switch (action.type) {

      case ActionType.SHOW_ALERT:
         return {
            ...state,
            alert: action.alert,
         };

      case ActionType.HIDE_ALERT:
         return {
            ...state,
            alert: {
               ...state.alert,
               show: false,
            },
         };

      default:
         return state;

   }
};
