import Keen from 'keen-js';

function isFunction(val) {
  return typeof val === 'function';
}

export default function keenAnalytics(projectId, writeKey, getGlobals) {
  if (!projectId) throw new Error('You must provide a project id.');
  if (!writeKey) throw new Error('You must provide a write key required for sending data.');

  let keenClient = new Keen({ projectId, writeKey });
  let globals = {};

  return store => next => action => {
    if (!action.meta ||
      !action.meta.analytics ||
      !action.meta.analytics.collection) {
      return next(action);
    }

    try {
      if (isFunction(getGlobals)) {
        globals = getGlobals(store.getState());
      }

      const { collection, event } = action.meta.analytics;
      keenClient.addEvent(collection, { ...globals, ...event });
    } catch(error) {
      console.error(error);
    }
    return next(action);
  };
};
