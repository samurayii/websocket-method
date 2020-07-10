# Websocket-method

Json websocket server/client.

### Example

```js
const config = require('./config');
const schema = require('./schema');
const json_from_schema = require('json-from-default-schema');

const result_config = json_from_schema(config, schema);

```

## fn(config:Object, schema:Object) → Object

Synchronously create json from schema.