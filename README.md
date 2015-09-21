redux-keen
==========

[![npm version](https://img.shields.io/npm/v/redux-keen.svg?style=flat-square)](https://www.npmjs.com/package/redux-keen)

[Redux](http://rackt.github.io/redux) middleware for sending analytics to [Keen IO](https://keen.io/).

## Instalation

```js
npm install --save redux-keen
```

## Usage

```js
import keenAnalytics from 'redux-keen';

let keenMiddleware = keenAnalytics('YOUR_PROJECT_ID', 'YOUR_WRITE_KEY');
```

The default export is a function requiring Keen IO project id and API write key. This function returns a middleware function, that can be applied using `applyMiddleware` from [Redux](http://rackt.github.io/redux).

If it receives an action whose `meta` property contains an `analytics` property with non-empty `collection` property, it will record the event in the Keen IO analytics.

### Actions

An action that should be recorded to analytics MUST
- have an `analytics` property inside its `meta` property
- have a `collection` property inside its `analytics` property

and MAY
- have an `event` property inside its `analytics` property

#### `collection`
The required `collection` property inside the `analytics` specifies the Keen IO [event collection](https://keen.io/docs/api/#event-collections).

#### `event`
The optional `event` property inside the `analytics` contains the data of the Keen IO [event](https://keen.io/docs/api/#events).


#### An example of an action:
```js
{
  type: ADD_TO_SHOPPING_CART,
  payload: item,
  meta: {
    analytics: {
      collection: "add_item_to_shopping_cart"
    }
  }
}
```

#### An example with optional property `event`:
```js
{
  type: ADD_TO_SHOPPING_CART,
  payload: item,
  meta: {
    analytics: {
      collection: "add_item_to_shopping_cart",
      event: {
        item: {
          title: item.title,
          itemId: item.itemId
        }
      }
    }
  }
}
```


### Globals
When setting up analytics with Keen IO, we often want to send some common data (hereinafter referred to as `globals`) with each event (e.g. device information, geolocation, authenticated user, etc.).

The default function that creates keenMiddleware accepts an optional third parameter `getGlobals`.
If provided, `getGlobals` must be a function returning a javascript object. It is called everytime the middleware intercepts a an action with valid analytics property.

```js
let keenMiddleware = keenAnalytics(projectId, writeKey, getGlobals);
```

The redux state is passed as parameter to the provided function. You can use it for example for getting the authenticated user information (see the example bellow).

```js
function getLocationPayload() {
  return {
    ip_address: '${keen.ip}',
    keen: {
      addons: [
        {
          name: 'keen:ip_to_geo',
          input: {
            ip: 'ip_address'
          },
          output: 'ip_geo_info'
        }
      ]
    }
  };
}

function getUserPayload(state) {
  const { isSignedIn, user } = state.session;
  if (!isSignedIn) {
    return {};
  }

  let userGlobals = {
    user: {
      name: `${user.firstName} ${user.lastName}`,
      userId: user.profileId
    }
  };

  return userGlobals;
}

export default function getGlobals(state) {
  const location = getLocationPayload();
  const user = getUserPayload(state);

  return {
    ...location,
    ...user
  };
}
```

If `getGlobals` provided the globals are sent by the middleware with each event, even when the action has a valid `analytics` property with the `event` property omitted.
