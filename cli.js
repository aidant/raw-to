const rawTo = require('.')

const [format, input, output] = process.argv.splice(2)

console.log('Parsing images in', input, 'please wait, this may take a while')
rawTo(input, output, { format })
  .then((images) => {
    console.log('Converted images')
    if (images.length > 10) images = [...images.splice(0, 10), `... ${images.length} more`]
    console.log(images.join('\n'))
  })
  .catch(console.error)
