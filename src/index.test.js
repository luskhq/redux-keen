/* eslint-env node, mocha */

'use strict';

const sinon = require('sinon');
const spy = require('sinon').spy;
const stub = require('sinon').stub;
const chai = require('chai');
const createKeenMiddleware = require('../lib/');

const state = { user: { first_name: 'John', last_name: 'Shrimp' } };
const store = { getState: () => {} };
const keenClient = { addEvent: () => {} };
const next = spy();

describe('Redux Keen', () => {

  beforeEach(() => {
    spy(keenClient, 'addEvent');
    stub(store, 'getState').returns(state);
  });

  afterEach(() => {
    keenClient.addEvent.restore();
    store.getState.restore();
    next.reset();
  });

  describe('constructor', () => {
    it('returns a middleware', () => {
      const keenMiddleware = createKeenMiddleware(keenClient);

      chai.assert.isFunction(keenMiddleware);
    });

    it('complains if you don\'t pass it a client instance with addEvent method', () => {
      chai.assert.throw(createKeenMiddleware, Error);
    });
  });

  describe('middleware', () => {
    it('returns a `next` handler', () => {
      const nextHandler = createKeenMiddleware(keenClient)(store);

      chai.assert.isFunction(nextHandler);
    });
  });

  describe('next handler', () => {
    it('returns an `action` handler', () => {
      const actionHandler = createKeenMiddleware(keenClient)(store)(next);

      chai.assert.isFunction(actionHandler);
    });
  });

  describe('action handler', () => {
    const keenMiddleware = createKeenMiddleware(keenClient);

    it('calls keenClient.addEvent() when actions contain meta.analytics.collection', () => {
      const action = { meta: { analytics: { collection: 'sent_message' } } };
      keenMiddleware(store)(next)(action);

      sinon.assert.calledWith(keenClient.addEvent, 'sent_message');
    });

    it('uses properties in meta.analytics.event to enrich the event', () => {
      const action = { meta: { analytics: { collection: 'sent_message', event: { contents: 'Lobsters are awesome.' } } } };
      keenMiddleware(store)(next)(action);

      sinon.assert.calledWith(keenClient.addEvent, 'sent_message', { contents: 'Lobsters are awesome.' });
    });

    it('ignores actions without `meta.analytics.collection` property', () => {
      const action = {};
      keenMiddleware(store)(next)(action);

      sinon.assert.notCalled(keenClient.addEvent);
    });

    it('calls getProperties(state) callback and adds its contents to the Keen event', () => {
      const getProperties =  sinon.spy((state) => state.user);
      const keenMiddlewareWithCb = createKeenMiddleware(keenClient, getProperties);
      const action = { meta: { analytics: { collection: 'sent_message', event: { contents: 'Lobsters are awesome.' } } } };
      keenMiddlewareWithCb(store)(next)(action);

      sinon.assert.calledWith(getProperties, state);
      sinon.assert.calledWith(keenClient.addEvent, 'sent_message', { contents: 'Lobsters are awesome.', first_name: 'John', last_name: 'Shrimp' });
    });

    it('calls next middleware', () => {
      const action = {};
      keenMiddleware(store)(next)(action);

      sinon.assert.callCount(next, 1);
    });
  });

});
