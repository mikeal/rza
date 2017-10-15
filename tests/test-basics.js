/* globals clean, same */
const puppeteer = require('puppeteer')
const { test } = require('tap')

const path = require('path')
const bl = require('bl')
const browserify = require('browserify')

const bundle = new Promise((resolve, reject) => {
  var b = browserify()
  b.add(path.join(__dirname, 'components.js'))
  b.bundle().pipe(bl((err, buff) => {
    if (err) return reject(err)
    resolve(buff)
  }))
})

const index = async inner => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <script>${await bundle}</script>
      ${await inner}
    </body>
  </html>
  `
}

let browser

test('setup', async t => {
  browser = await puppeteer.launch()
  t.end()
})

const getPage = async (t, inner) => {
  const page = await browser.newPage()
  page.on('error', err => { throw err })
  page.on('pageerror', msg => { throw new Error(`Page Error: ${msg}`) })
  await page.setContent(await index(inner))
  page.on('console', msg => console.log(msg.text))
  let same = (x, y) => t.same(x, y)
  await page.exposeFunction('same', (x, y) => {
    same(x, y)
  })
  return page
}

test('basic', async t => {
  t.plan(2)
  let page = await getPage(t, `<test-one></test-one>`)
  await page.waitFor('test-one render')
  await page.evaluate(async () => {
    let expects = '<div>1</div>'
    same(clean(document.querySelector('test-one render').innerHTML), expects)
    let shadowExpect = clean(`
    <style>:host{margin:0000;padding:0000;}
    ::slotted([slot="render"])
    {margin:0000;padding:0000;}</style>
    <slotname="render"></slot>`)
    same(clean(document.querySelector('test-one').shadowRoot.innerHTML), shadowExpect)
  })
  await page.close()
})

test('defaults', async t => {
  t.plan(2)
  let page = await getPage(t, `<test-two></test-two>`)
  await page.waitFor('test-two render')
  await page.evaluate(async () => {
    let expects = '<div>2</div>'
    same(clean(document.querySelector('test-two render').innerHTML), expects)
  })
  await page.close()
  page = await getPage(t, `<test-two test="5"></test-two>`)
  await page.waitFor('test-two render')
  await page.evaluate(async () => {
    let expects = '<div>5</div>'
    same(clean(document.querySelector('test-two render').innerHTML), expects)
  })
  await page.close()
})

test('subclass', async t => {
  t.plan(1)
  let page = await getPage(t, `<test-three></test-three>`)
  await page.waitFor('test-three render')
  await page.evaluate(async () => {
    let expects = '<div>2</div>'
    same(clean(document.querySelector('test-three render').innerHTML), expects)
  })
  await page.close()
})

test('innerhtml', async t => {
  t.plan(2)
  let page = await getPage(t, `<test-four><span>4</span></test-four>`)
  await page.waitFor('test-four render')
  await page.evaluate(async () => {
    let expects = '<wrap><span>4</span></wrap>'
    same(clean(document.querySelector('test-four render').innerHTML), expects)
  })
  await page.close()
  page = await getPage(t, `<test-four><span>4</span></test-four>`)
  await page.waitFor('test-four render')
  await page.evaluate(async () => {
    let expects = '<wrap><span>4</span></wrap>'
    same(clean(document.querySelector('test-four render').innerHTML), expects)
    document.querySelector('test-four').innerHTML = '<finished></finished>'
  })
  await page.waitFor('test-four render wrap finished')
  await page.close()
})

test('return element in render', async t => {
  t.plan(4)
  let page = await getPage(t, `<test-five></test-five>`)
  await page.waitFor('test-five five-t')
  await page.evaluate(async () => {
    let expects = ''
    same(clean(document.querySelector('test-five five-t').innerHTML), expects)
  })
  await page.evaluate(async () => {
    document.querySelector('test-five five-t').innerHTML = '5'
    let expect = '<five-tslot="render">5</five-t>'
    same(clean(document.querySelector('test-five').innerHTML), expect)
    document.querySelector('test-five').t += 1
  })
  await page.evaluate(async () => {
    setTimeout(() => {
      same(document.querySelector('test-five').renderCounter, 3)
      let expect = '<five-tslot="render">5</five-t>'
      same(clean(document.querySelector('test-five').innerHTML), expect)
      document.body.innerHTML += '<test-finished></test-finished>'
    }, 100)
  })
  await page.waitFor('test-finished')

  await page.close()
})

test('shadowDOM attribute', async t => {
  t.plan(1)
  let page = await getPage(t, `<test-six></test-six>`)
  await page.waitFor('test-six render')
  await page.evaluate(async () => {
    let expects = '<style></style>'
    same(clean(document.querySelector('test-six').shadowRoot.innerHTML), expects)
  })
  await page.close()
})

test('re-render triggers', async t => {
  t.plan(4)
  let page = await getPage(t, `<test-seven></test-seven>`)
  await page.waitFor('test-seven render default')
  await page.evaluate(async () => {
    let expects = '<default>1</default>'
    same(clean(document.querySelector('test-seven render').innerHTML), expects)
    document.querySelector('test-seven').tag = 'prop-test'
  })
  await page.waitFor('test-seven render prop-test')
  await page.evaluate(async () => {
    let expects = '<prop-test>2</prop-test>'
    same(clean(document.querySelector('test-seven render').innerHTML), expects)
    document.querySelector('test-seven').setAttribute('tag', 'attr-test')
  })
  await page.waitFor('test-seven attr-test')
  await page.evaluate(async () => {
    let expects = '<attr-test>3</attr-test>'
    same(clean(document.querySelector('test-seven render').innerHTML), expects)
    document.querySelector('test-seven').innerHTML = 'TEST FAILED!'
    setTimeout(() => {
      expects = '<attr-test>4</attr-test>'
      same(clean(document.querySelector('test-seven render').innerHTML), expects)
      document.body.innerHTML += '<test-finished></test-finished>'
    }, 100)
  })
  await page.waitFor('test-finished')
  await page.close()
})

test('default function initializers', async t => {
  t.plan(4)
  let page = await getPage(t, `<test-eight></test-eight>`)
  await page.waitFor('test-eight render')
  await page.evaluate(async () => {
    let expects = '<wrap>1/0/0</wrap>'
    same(clean(document.querySelector('test-eight render').innerHTML), expects)
    document.querySelector('test-eight').fn += 1
    document.querySelector('test-eight').afn += 1
    setTimeout(() => {
      expects = '<wrap>2/1/1</wrap>'
      same(clean(document.querySelector('test-eight render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 100)
  })
  await page.waitFor('test-next')
  await page.close()
  page = await getPage(t, `
    <test-eight fn="1" afn="1" ></test-eight>
  `)
  await page.waitFor('test-eight')
  await page.evaluate(async () => {
    let expects = '<wrap>1/1/1</wrap>'
    same(clean(document.querySelector('test-eight render').innerHTML), expects)
    document.querySelector('test-eight').setAttribute('fn', '0')
    document.querySelector('test-eight').setAttribute('afn', '0')
    setTimeout(() => {
      expects = '<wrap>2/0/0</wrap>'
      same(clean(document.querySelector('test-eight render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 100)
  })
  await page.waitFor('test-next')
  await page.close()
})

test('array as default properties', async t => {
  t.plan(4)
  let page = await getPage(t, `<test-nine></test-nine>`)
  await page.waitFor('test-nine render')
  await page.evaluate(async () => {
    let expects = '<wrap>1/undefined/undefined</wrap>'
    same(clean(document.querySelector('test-nine render').innerHTML), expects)
    document.querySelector('test-nine').test = 'prop'
    setTimeout(() => {
      expects = '<wrap>2/prop/prop</wrap>'
      same(clean(document.querySelector('test-nine render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 100)
  })
  await page.waitFor('test-next')
  await page.close()
  page = await getPage(t, `<test-nine test="reset"></test-nine>`)
  await page.waitFor('test-nine render')
  await page.evaluate(async () => {
    let expects = '<wrap>1/reset/reset</wrap>'
    same(clean(document.querySelector('test-nine render').innerHTML), expects)
    document.querySelector('test-nine').test = 'prop'
    setTimeout(() => {
      expects = '<wrap>2/prop/prop</wrap>'
      same(clean(document.querySelector('test-nine render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 100)
  })
  await page.waitFor('test-next')
  await page.close()
})

test('waitFor', async t => {
  t.plan(2)
  let page = await getPage(t, '<test-four></test-four>')
  await page.waitFor('test-four render')
  await page.evaluate(async () => {
    let expects = '<wrap></wrap>'
    same(clean(document.querySelector('test-four render').innerHTML), expects)
    document.querySelector('test-four').waitFor('newprop').then(result => {
      document.querySelector('test-four').innerHTML = `<${result}></${result}>`
    })
    document.querySelector('test-four').newprop = 'test-finished'
  })
  await page.waitFor('test-finished')
  await page.evaluate(async () => {
    let expects = '<wrap><test-finished></test-finished></wrap>'
    same(clean(document.querySelector('test-four render').innerHTML), expects)
  })
  await page.close()
})

test('teardown', async t => {
  await browser.close()
  t.end()
})
