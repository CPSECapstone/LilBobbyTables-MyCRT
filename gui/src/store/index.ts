import { createStore, Store } from 'redux';

import { PageState, rootReducer } from '../reducers';

export const store: Store<PageState> = createStore(rootReducer);
