import { Action } from 'redux';
import { ICapture, IChildProgram } from '../../../../common/dist/main';

export interface ToggleGraphAction extends Action {
    value: boolean;
    id: number;
}

export const TOGGLE_GRAPH = 'TOGGLE_GRAPH';

export const makeToggleGraphAction = (value: boolean, id: number): ToggleGraphAction => {
    return {
        type: TOGGLE_GRAPH,
        value,
        id,
    };
};

export interface AddGraphAction extends Action {
    show: boolean;
    displayName: string;
    data: any[];
}

export const ADD_GRAPH = 'ADD_GRAPH';

export const addGraphAction = (displayName: string, data: any[]): AddGraphAction => {
    return {
        type: ADD_GRAPH,
        show: true,
        displayName,
        data,
    };
};

export interface AddCaptureIdAction extends Action {
    id: number;
}

export const ADD_CAPTURE_ID = "ADD_CAPTURE_ID";

export const addCaptureIdAction = (id: number): AddCaptureIdAction => {
    return {
        type: ADD_CAPTURE_ID,
        id,
    };
};

export interface AddCaptureAction extends Action {
    capture: IChildProgram;
}

export const ADD_CAPTURE = "ADD_CAPTURE";

export const addCaptureAction = (capture: IChildProgram): AddCaptureAction => {
    return {
        type: ADD_CAPTURE,
        capture,
    };
};
