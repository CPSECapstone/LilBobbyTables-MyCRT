import { showAlert } from '../../actions';
import { BrowserLogger as logger } from '../../logging';
import { store } from '../../store';

window.onerror = function(eventOrMsg: any, source?: string, lineNo?: number, columnNo?: number,
      error?: any) {

   const str = typeof eventOrMsg === 'string' ? eventOrMsg.toLowerCase() : "";
   const substr = "script error";
   let msg: string = "";
   if (str.indexOf(substr) > -1) {
      msg = "Script Error: See Browser Console for Detail";
   } else {
      msg = [
         "Message: " + JSON.stringify(eventOrMsg),
         "URL: " + source,
         "Line: " + lineNo,
         "Column: " + columnNo,
         "Error object: " + JSON.stringify(error),
      ].join(' - ');
   }

   store.dispatch(showAlert({
      show: true,
      header: "An Unexpected Error Has Occurred",
      message: msg,
   }));

   return false;
};
