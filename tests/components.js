let RZA = require('../')

class TestOne extends RZA {
  render () {
    return '<div>1</div>'
  }
}
window.customElements.define('test-one', TestOne)

class TestTwo extends RZA {
  get defaults () {
    return {test: 2}
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
    return ['test']
  }
  render (settings) {
    if (!this.renderCounter) this.renderCounter = 0
    this.renderCounter += 1
    return `<wrap>${this.renderCounter}/${settings.test}/${this.test}</wrap>`
  }
}
window.customElements.define('test-nine', TestDefaultArray)

window.clean = str => str.replace(/\n/g, '').replace(/ /g, '')
