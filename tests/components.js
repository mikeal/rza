/* globals t */
let RZA = require('../')

class TestOne extends RZA {
  render () {
    return '<div>1</div>'
  }
}
window.customElements.define('test-one', TestOne)

class TestTwo extends RZA {
  get defaults () {
    return {test: 2, arr: []}
  }
  render (settings) {
    return `<div>${settings.test}</div>`
  }
}
window.customElements.define('test-two', TestTwo)

class TestThree extends TestTwo {
}
window.customElements.define('test-three', TestThree)

class TestFour extends RZA {
  render (settings, innerHTML) {
    return `<wrap>${innerHTML}</wrap>`
  }
}
window.customElements.define('test-four', TestFour)

class TestFive extends RZA {
  get defaults () {
    return {test: document.createElement('five-t'), t: 0}
  }
  render (settings, innerHTML) {
    if (!this.renderCounter) this.renderCounter = 0
    this.renderCounter += 1
    return settings.test
  }
}
window.customElements.define('test-five', TestFive)

class TestSix extends RZA {
  render () {
    return ''
  }
  get shadow () {
    return '<style></style>'
  }
}
window.customElements.define('test-six', TestSix)

class TestSeven extends RZA {
  get defaults () {
    return {'tag': 'default'}
  }
  render (settings) {
    if (!this.renderCounter) this.renderCounter = 0
    this.renderCounter += 1
    return `<${settings.tag}>${this.renderCounter}</${settings.tag}>`
  }
}
window.customElements.define('test-seven', TestSeven)

class TestDefaultFunctions extends RZA {
  get defaults () {
    return {fn: () => 0, afn: async () => 0}
  }
  render (settings) {
    if (!this.renderCounter) this.renderCounter = 0
    this.renderCounter += 1
    return `<wrap>${this.renderCounter}/${settings.fn}/${settings.afn}</wrap>`
  }
}
window.customElements.define('test-eight', TestDefaultFunctions)

class TestDefaultArray extends RZA {
  get defaults () {
    return ['test', 'test2']
  }
  render (settings) {
    // Validate the array doesn't actually get mapped directly as defaults
    t.same(settings['0'], undefined)
    if (!this.renderCounter) this.renderCounter = 0
    this.renderCounter += 1
    return `<wrap>${this.renderCounter}/${settings.test}/${this.test}</wrap>`
  }
}
window.customElements.define('test-nine', TestDefaultArray)

class TestAddSetting extends RZA {
  render (settings) {
    if (!this.renderCounter) this.renderCounter = 0
    this.renderCounter += 1
    return `<wrap>${this.renderCounter}/${settings.test}/${this.testtwo}</wrap>`
  }
}
window.customElements.define('test-ten', TestAddSetting)

class TestBoolDefaults extends RZA {
  get defaults () {
    return {flipFalse: true, flipTrue: false}
  }
  render (settings) {
    return null
  }
}
window.customElements.define('test-bool', TestBoolDefaults)

class TestRerender extends RZA {
  get defaults () {
    return ['test']
  }
  render (settings) {
    if (this.test) {
      t.ok(true)
      return true
    }
    let p = new Promise(resolve => {
      setTimeout(() => {
        t.same(this.test, 'next')
        resolve()
      }, 0)
    })
    this.test = 'next'
    return p
  }
}
window.customElements.define('test-rerender', TestRerender)

class TestEarlyWait extends RZA {
  get defaults () {
    return ['early']
  }
  render (settings) {
    return '<span>test</test>'
  }
}
window.customElements.define('test-early-wait', TestEarlyWait)

window.clean = str => str.replace(/\n/g, '').replace(/ /g, '')
