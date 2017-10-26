/* globals clean */
const path = require('path')
const cappadonna = require('cappadonna')
const test = cappadonna(path.join(__dirname, 'components.js'))

test('basic', async (page, t) => {
  t.plan(2)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-one></test-one>`
    let el = await document.querySelector('test-one').nextRender()
    let expects = '<div>1</div>'
    t.same(clean(el.innerHTML), expects)
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
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-two></test-two>`
    let el = await document.querySelector('test-two').nextRender()
    let expects = '<div>2</div>'
    t.same(clean(el.innerHTML), expects)
    t.same(document.querySelector('test-two').arr, [])
  })
})

test('defaults set to non-default', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-two test="5"></test-two>`
    let el = await document.querySelector('test-two').nextRender()
    let expects = '<div>5</div>'
    t.same(clean(el.innerHTML), expects)
  })
})

test('subclass', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-three></test-three>`
    let el = await document.querySelector('test-three').nextRender()
    let expects = '<div>2</div>'
    t.same(clean(el.innerHTML), expects)
  })
})

test('innerhtml', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-four><span>4</span></test-four>`
    let el = await document.querySelector('test-four').nextRender()
    let expects = '<wrap><span>4</span></wrap>'
    t.same(clean(el.innerHTML), expects)
  })
})

test('return element in render', async (page, t) => {
  t.plan(4)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-five></test-five>`
    let el = document.querySelector('test-five')
    await el.nextRender()
    let expect = '<five-tslot="render"></five-t>'
    t.same(clean(el.innerHTML), expect)
    document.querySelector('test-five five-t').innerHTML = '5'
    expect = '<five-tslot="render">5</five-t>'
    t.same(clean(el.innerHTML), expect)
    el.t += 1
    await el.nextRender()
    t.same(el.renderCounter, 2)
    expect = '<five-tslot="render">5</five-t>'
    t.same(clean(el.innerHTML), expect)
  })
})

test('shadowDOM attribute', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-six></test-six>`
    let el = await document.querySelector('test-six')
    await el.nextRender()
    let expects = '<style></style>'
    t.same(clean(el.shadowRoot.innerHTML), expects)
  })
})

test('re-render triggers', async (page, t) => {
  t.plan(4)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-seven></test-seven>`
    let el = await document.querySelector('test-seven')
    let render = await el.nextRender()
    let expects = '<default>1</default>'
    t.same(clean(render.innerHTML), expects)
    document.querySelector('test-seven').tag = 'prop-test'
    await el.nextRender()
    expects = '<prop-test>2</prop-test>'
    t.same(clean(render.innerHTML), expects)
    document.querySelector('test-seven').setAttribute('tag', 'attr-test')
    await el.nextRender()
    expects = '<attr-test>3</attr-test>'
    t.same(clean(render.innerHTML), expects)
    el.innerHTML = 'TEST FAILED!'
    await el.nextRender()
    expects = '<attr-test>4</attr-test>'
    t.same(clean(render.innerHTML), expects)
  })
})

test('default function initializers', async (page, t) => {
  t.plan(2)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-eight></test-eight>`
    let el = document.querySelector('test-eight')
    let render = await el.nextRender()
    let expects = '<wrap>1/0/0</wrap>'
    t.same(clean(render.innerHTML), expects)
    el.fn += 1
    el.afn += 1
    await el.nextRender()
    expects = '<wrap>2/1/1</wrap>'
    t.same(clean(render.innerHTML), expects)
  })
})

test('default functions but set', async (page, t) => {
  t.plan(2)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-eight fn="1" afn="1" ></test-eight>`
    let expects = '<wrap>1/1/1</wrap>'
    let el = document.querySelector('test-eight')
    let render = await el.nextRender()
    t.same(clean(render.innerHTML), expects)
    el.setAttribute('fn', '0')
    el.setAttribute('afn', '0')
    await el.nextRender()
    expects = '<wrap>2/0/0</wrap>'
    t.same(clean(render.innerHTML), expects)
  })
})

test('array as default properties', async (page, t) => {
  t.plan(4)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-nine></test-nine>`
    let el = document.querySelector('test-nine')
    let render = await el.nextRender()
    let expects = '<wrap>1/undefined/undefined</wrap>'
    t.same(clean(render.innerHTML), expects)
    document.querySelector('test-nine').test = 'prop'
    await el.nextRender()
    expects = '<wrap>2/prop/prop</wrap>'
    t.same(clean(render.innerHTML), expects)
  })
})

test('array as defaults with non-default', async (page, t) => {
  t.plan(4)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-nine test="reset"></test-nine>`
    let el = document.querySelector('test-nine')
    let render = await el.nextRender()
    let expects = '<wrap>1/reset/reset</wrap>'
    t.same(clean(render.innerHTML), expects)
    document.querySelector('test-nine').test = 'prop'
    await el.nextRender()
    expects = '<wrap>2/prop/prop</wrap>'
    t.same(clean(render.innerHTML), expects)
  })
})

test('waitFor', async (page, t) => {
  t.plan(2)
  await page.evaluate(async () => {
    document.body.innerHTML += '<test-four></test-four>'
    let el = document.querySelector('test-four')
    let render = await el.nextRender()
    let expects = '<wrap></wrap>'
    t.same(clean(render.innerHTML), expects)
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
  await page.evaluate(async () => {
    document.body.innerHTML += '<test-ten></test-ten>'
    let el = document.querySelector('test-ten')
    let render = await el.nextRender()
    let expects = '<wrap>1/undefined/undefined</wrap>'
    t.same(clean(render.innerHTML), expects)
    el.addSetting('test', 'pass')
    el.addSetting('testtwo')
    await el.nextRender()
    expects = '<wrap>2/pass/undefined</wrap>'
    t.same(clean(render.innerHTML), expects)
    el.testtwo = 'pass'
    await el.nextRender()
    expects = '<wrap>3/pass/pass</wrap>'
    t.same(clean(render.innerHTML), expects)
  })
})
