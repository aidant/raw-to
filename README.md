# raw-to

## Usage
```shell
raw-to jpeg ./input ./output
```

```js
const rawTo = require('raw-to')
rawTo('./input', './output', { format: 'jpeg' })
  .then(console.log)
  .catch(console.error)
```
