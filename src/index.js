export default function keenAnalytics(keenClient, getGlobals) {
  if (!keenClient || !keenClient.addEvent) {
    throw new TypeError('You must provide a keen-js client instance.');
  }

  let globals = {};

  return (store) => (next) => (action) => {
    if (!action.meta || !action.meta.analytics || !action.meta.analytics.collection) {
      return next(action);
    }

    try {
      if (typeof getGlobals === 'function') {
        globals = getGlobals(store.getState());
      }

      const { collection, event } = action.meta.analytics;
      keenClient.addEvent(collection, { ...globals, ...event });
    }
    catch (error) {
      console.error(error);
    }
    return next(action);
  };
}
