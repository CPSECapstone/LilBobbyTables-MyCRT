import { AnyAction } from 'redux';

import { AlertState } from '../reducers';

export const enum ActionType {
   SHOW_ALERT = "SHOW_ALERT",
   HIDE_ALERT = "HIDE_ALERT",
}

export const showAlert = (alert: AlertState): AnyAction => ({
   type: ActionType.SHOW_ALERT,
   alert,
});

export const hideAlert = (): AnyAction => ({
   type: ActionType.HIDE_ALERT,
});
