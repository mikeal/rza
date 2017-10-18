/* globals clean */
const path = require('path')
const cappadonna = require('cappadonna')
const test = cappadonna(path.join(__dirname, 'components.js'))

test('basic', async (page, t) => {
  t.plan(2)
  await page.appendAndWait(`<test-one></test-one>`, 'test-one render')
  await page.evaluate(async () => {
    let expects = '<div>1</div>'
    t.same(clean(document.querySelector('test-one render').innerHTML), expects)
    let shadowExpect = clean(`
    <style>:host{margin:0000;padding:0000;}
    ::slotted([slot="render"])
    {margin:0000;padding:0000;}</style>
    <slotname="render"></slot>`)
    t.same(clean(document.querySelector('test-one').shadowRoot.innerHTML), shadowExpect)
  })
})

test('defaults', async (page, t) => {
  t.plan(2)
  await page.appendAndWait(`<test-two></test-two>`, 'test-two render')
  await page.evaluate(async () => {
    let expects = '<div>2</div>'
    t.same(clean(document.querySelector('test-two render').innerHTML), expects)
    t.same(document.querySelector('test-two').arr, [])
  })
})

test('defaults set to non-default', async (page, t) => {
  t.plan(1)
  await page.appendAndWait(`<test-two test="5"></test-two>`, 'test-two render')
  await page.evaluate(async () => {
    let expects = '<div>5</div>'
    t.same(clean(document.querySelector('test-two render').innerHTML), expects)
  })
})

test('subclass', async (page, t) => {
  t.plan(1)
  await page.appendAndWait(`<test-three></test-three>`, 'test-three render')
  await page.evaluate(async () => {
    let expects = '<div>2</div>'
    t.same(clean(document.querySelector('test-three render').innerHTML), expects)
  })
})

test('innerhtml', async (page, t) => {
  t.plan(1)
  let str = `<test-four><span>4</span></test-four>`
  await page.appendAndWait(str, 'test-four render')
  await page.evaluate(async () => {
    let expects = '<wrap><span>4</span></wrap>'
    t.same(clean(document.querySelector('test-four render').innerHTML), expects)
  })
})

test('return element in render', async (page, t) => {
  t.plan(4)
  await page.appendAndWait(`<test-five></test-five>`, 'test-five five-t')
  await page.evaluate(async () => {
    let expects = ''
    t.same(clean(document.querySelector('test-five five-t').innerHTML), expects)
  })
  await page.evaluate(async () => {
    document.querySelector('test-five five-t').innerHTML = '5'
    let expect = '<five-tslot="render">5</five-t>'
    t.same(clean(document.querySelector('test-five').innerHTML), expect)
    document.querySelector('test-five').t += 1
  })
  await page.evaluate(async () => {
    setTimeout(() => {
      t.same(document.querySelector('test-five').renderCounter, 2)
      let expect = '<five-tslot="render">5</five-t>'
      t.same(clean(document.querySelector('test-five').innerHTML), expect)
      document.body.innerHTML += '<test-finished></test-finished>'
    }, 10)
  })
  await page.waitFor('test-finished')
})

test('shadowDOM attribute', async (page, t) => {
  t.plan(1)
  await page.appendAndWait(`<test-six></test-six>`, 'test-six render')
  await page.evaluate(async () => {
    let expects = '<style></style>'
    t.same(clean(document.querySelector('test-six').shadowRoot.innerHTML), expects)
  })
})

test('re-render triggers', async (page, t) => {
  t.plan(4)
  let selector = 'test-seven render default'
  await page.appendAndWait(`<test-seven></test-seven>`, selector)
  await page.evaluate(async () => {
    let expects = '<default>1</default>'
    t.same(clean(document.querySelector('test-seven render').innerHTML), expects)
    document.querySelector('test-seven').tag = 'prop-test'
  })
  await page.waitFor('test-seven render prop-test')
  await page.evaluate(async () => {
    let expects = '<prop-test>2</prop-test>'
    t.same(clean(document.querySelector('test-seven render').innerHTML), expects)
    document.querySelector('test-seven').setAttribute('tag', 'attr-test')
  })
  await page.waitFor('test-seven attr-test')
  await page.evaluate(async () => {
    let expects = '<attr-test>3</attr-test>'
    t.same(clean(document.querySelector('test-seven render').innerHTML), expects)
    document.querySelector('test-seven').innerHTML = 'TEST FAILED!'
    setTimeout(() => {
      expects = '<attr-test>4</attr-test>'
      t.same(clean(document.querySelector('test-seven render').innerHTML), expects)
      document.body.innerHTML += '<test-finished></test-finished>'
    }, 10)
  })
  await page.waitFor('test-finished')
})

test('default function initializers', async (page, t) => {
  t.plan(2)
  await page.appendAndWait(`<test-eight></test-eight>`, 'test-eight render')
  await page.evaluate(async () => {
    let expects = '<wrap>1/0/0</wrap>'
    t.same(clean(document.querySelector('test-eight render').innerHTML), expects)
    document.querySelector('test-eight').fn += 1
    document.querySelector('test-eight').afn += 1
    setTimeout(() => {
      expects = '<wrap>2/1/1</wrap>'
      t.same(clean(document.querySelector('test-eight render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 10)
  })
  await page.waitFor('test-next')
})

test('default functions but set', async (page, t) => {
  t.plan(2)
  let str = `<test-eight fn="1" afn="1" ></test-eight>`
  await page.appendAndWait(str, 'test-eight')
  await page.evaluate(async () => {
    let expects = '<wrap>1/1/1</wrap>'
    t.same(clean(document.querySelector('test-eight render').innerHTML), expects)
    document.querySelector('test-eight').setAttribute('fn', '0')
    document.querySelector('test-eight').setAttribute('afn', '0')
    setTimeout(() => {
      expects = '<wrap>2/0/0</wrap>'
      t.same(clean(document.querySelector('test-eight render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 10)
  })
  await page.waitFor('test-next')
})

test('array as default properties', async (page, t) => {
  t.plan(2)
  await page.appendAndWait(`<test-nine></test-nine>`, 'test-nine render')
  await page.evaluate(async () => {
    let expects = '<wrap>1/undefined/undefined</wrap>'
    t.same(clean(document.querySelector('test-nine render').innerHTML), expects)
    document.querySelector('test-nine').test = 'prop'
    setTimeout(() => {
      expects = '<wrap>2/prop/prop</wrap>'
      t.same(clean(document.querySelector('test-nine render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 10)
  })
  await page.waitFor('test-next')
})

test('array as defaults with non-default', async (page, t) => {
  t.plan(2)
  let str = `<test-nine test="reset"></test-nine>`
  await page.appendAndWait(str, 'test-nine render')
  await page.evaluate(async () => {
    let expects = '<wrap>1/reset/reset</wrap>'
    t.same(clean(document.querySelector('test-nine render').innerHTML), expects)
    document.querySelector('test-nine').test = 'prop'
    setTimeout(() => {
      expects = '<wrap>2/prop/prop</wrap>'
      t.same(clean(document.querySelector('test-nine render').innerHTML), expects)
      document.body.innerHTML += '<test-next></test-next>'
    }, 10)
  })
  await page.waitFor('test-next')
})

test('waitFor', async (page, t) => {
  t.plan(2)
  await page.appendAndWait('<test-four></test-four>', 'test-four render')
  await page.evaluate(async () => {
    let expects = '<wrap></wrap>'
    t.same(clean(document.querySelector('test-four render').innerHTML), expects)
    document.querySelector('test-four').waitFor('newprop').then(result => {
      document.querySelector('test-four').innerHTML = `<${result}></${result}>`
    })
    document.querySelector('test-four').newprop = 'test-finished'
  })
  await page.waitFor('test-finished')
  await page.evaluate(async () => {
    let expects = '<wrap><test-finished></test-finished></wrap>'
    t.same(clean(document.querySelector('test-four render').innerHTML), expects)
  })
})

test('addSetting', async (page, t) => {
  t.plan(3)
  await page.appendAndWait('<test-ten></test-ten>', 'test-ten render')
  await page.evaluate(async () => {
    let expects = '<wrap>1/undefined/undefined</wrap>'
    t.same(clean(document.querySelector('test-ten render').innerHTML), expects)
    document.querySelector('test-ten').addSetting('test', 'pass')
    document.querySelector('test-ten').addSetting('testtwo')
    setTimeout(() => {
      let expects = '<wrap>2/pass/undefined</wrap>'
      t.same(clean(document.querySelector('test-ten render').innerHTML), expects)
      document.querySelector('test-ten').testtwo = 'pass'
      setTimeout(() => {
        let expects = '<wrap>3/pass/pass</wrap>'
        t.same(clean(document.querySelector('test-ten render').innerHTML), expects)
        document.body.innerHTML += '<test-finished></test-finished>'
      }, 10)
    }, 10)
  })
  await page.waitFor('test-finished')
})
