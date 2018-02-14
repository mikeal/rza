/* globals clean */
const path = require('path')
const cappadonna = require('cappadonna')
const test = cappadonna(path.join(__dirname, 'components.js'))

test('skip render on slot', async (page, t) => {
  t.plan(5)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-five></test-five>`
    let el = document.querySelector('test-five')
    await el.nextRender()
    let expects = '<five-tslot="render"></five-t>'
    t.same(clean(document.querySelector('test-five').innerHTML), expects)
    t.same(document.querySelector('test-five').renderCounter, 1)
    let div = document.querySelector('test-five five-t')
    div.textContent += 'asdf'
    setTimeout(() => {
      div.innerHTML += 'asdf'
      t.same(div.innerHTML, 'asdfasdf')
      t.same(document.querySelector('test-five').renderCounter, 1)
      setTimeout(() => {
        let slot = document.querySelector('test-five').querySelector('[slot="render"]')
        slot.setAttribute('nothing', 'not')
        setTimeout(() => {
          t.same(document.querySelector('test-five').renderCounter, 1)
          document.body.innerHTML += '<test-finished></test-finished>'
        }, 10)
      }, 10)
    }, 10)
  })
  await page.waitFor('test-finished')
})

test('render textContent change', async (page, t) => {
  t.plan(3)
  await page.evaluate(async () => {
    document.body.innerHTML += `<test-five></test-five>`
    let el = document.querySelector('test-five')
    await el.nextRender()
    let expects = '<five-tslot="render"></five-t>'
    t.same(clean(el.innerHTML), expects)
    t.same(el.renderCounter, 1)
    el.textContent = 'asdf'
    await el.nextRender()
    t.same(document.querySelector('test-five').renderCounter, 2)
  })
})

test('boolean defaults', async (page, t) => {
  t.plan(4)
  await page.appendAndWait('<test-bool flipFalse flipTrue ></test-bool>', 'test-bool render')
  await page.evaluate(async () => {
    let el = document.querySelector('test-bool')
    t.same(el.flipFalse, false)
    t.same(el.flipTrue, true)
    document.body.innerHTML = '<test-bool flipFalse="false" flipTrue="false"></test-bool>'
  })
  await page.waitFor('test-bool render')
  await page.evaluate(async () => {
    let el = document.querySelector('test-bool')
    t.same(el.flipFalse, false)
    t.same(el.flipTrue, true)
  })
})

test('set props before finished', async (page, t) => {
  t.plan(7)
  await page.evaluate(async () => {
    let el = document.createElement('test-bool')
    el.flipFalse = false
    el.flipTrue = true
    t.same(el.flipFalse, false)
    t.same(el.flipTrue, true)
    await el.nextRender()
    let promises = Promise.all(
      [el.waitFor('noop'),
        el.waitFor('noop'),
        el.waitFor('flipTrue'),
        el.waitFor('flipTrue')]
    )
    el.noop = true
    await promises
    el.flipTrue = [[]]
    t.same(el.flipTrue, [[]])
    el.flipTrue = 'false'
    el.flipFalse = 'true'
    t.same(el.flipFalse, true)
    t.same(el.flipTrue, false)

    /* validate that non-default props are not bound */
    el.setAttribute('another', 'test')
    t.same(typeof el.another, 'undefined')

    /* add setting that already exists */
    el.addSetting('flipTrue', true)
    t.same(el.flipTrue, true)
  })
})

test('re-rendering', async (page, t) => {
  t.plan(2)
  await page.evaluate(async () => {
    document.body.innerHTML += '<test-rerender></test-rerender>'
    let el = document.querySelector('test-rerender')
    await el.nextRender()
  })
})

test('set shadow', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    let el = document.createElement('test-bool')
    el.shadow = '<div></div>'
    t.same(el.shadowRoot.innerHTML, '<div></div>')
  })
})

test('early wait', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    let el = document.createElement('test-early-wait')
    let promises = Promise.all([el.waitFor('early'), el.waitFor('early')])
    el.early = true
    t.same(await promises, [true, true])
  })
})
