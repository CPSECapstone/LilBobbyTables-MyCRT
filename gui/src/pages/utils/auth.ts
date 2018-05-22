import { CSSProperties } from 'react';

import { State as changePasswordState } from '../changePassword';
import { State as loginState } from '../login';
import { State as signupState } from '../signup';

export const style: {[name: string]: React.CSSProperties} = {

   signupCard: {
      marginTop: '4em',
      marginBottom: '2em',
      marginLeft: 'auto',
      marginRight: 'auto',
      width: '28em',
   },

   cardTitle: {
      marginBottom: '1.5em',
   },

   submit: {
      marginTop: '1.5em',
      marginLeft: 'auto',
      marginRight: 'auto',
   },

};

export function validSignupFields(state: signupState): boolean {
   return !!(
      state.email
      && state.password
      && state.password.match(/^.{8,64}$/)
      && state.password === state.confirmPassword
   );
}

export function validChangePasswordFields(state: changePasswordState): boolean {
   return !!(
      state.oldPassword
      && state.password
      && state.password.match(/^.{8,64}$/)
      && state.password === state.confirmPassword
   );
}

export function validLoginFields(state: loginState): boolean {
   return !!(
      state.email
      && state.password
   );
}
