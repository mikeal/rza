/* globals MutationObserver, HTMLElement */
require('setimmediate')
const {observed} = require('raekwon')

const values = o => Object.keys(o).map(k => o[k])

const observer = (element, onAttributes) => {
  var observer = new MutationObserver(mutations => {
    let valid = m => {
      if (m.target !== element) return false
      if (!element._render || element._rendering) return false
      return true
    }

    mutations = Array.from(mutations).filter(valid)
    if (!mutations.length) return

    let attrs = mutations.filter(m => m.type === 'attributes')
    if (attrs.length) {
      onAttributes(Object.assign({},
        ...attrs
        .filter(m => m.type === 'attributes')
        .map(m => m.attributeName)
        .map(attr => {
          let o = {}

          o[attr] = element.getAttribute(attr)
          return o
        })
      ))
    }

    mutations.filter(m => m.type === 'childList').forEach(m => {
      let nodes = Array.from(m.addedNodes).concat(Array.from(m.removedNodes))
      nodes = nodes.filter(n => {
        /* look at the parent of textNodes */
        if (!n.tagName) n = n.parentNode
        /* ignore anything in the render slot */
        return n.getAttribute('slot') !== 'render'
      })
      if (!nodes.length) return
      element._render()
    })
  })

  observer.observe(element, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
  })
  return observer
}

class RZA extends HTMLElement {
  waitFor (key) {
    return new Promise((resolve, reject) => {
      if (!this._waits[key]) this._waits[key] = []
      this._waits[key].push([resolve, reject])
    })
  }
  constructor () {
    super()
    this._afterRender = []
    this._waits = {}

    setImmediate(async () => {
      let _keys
      let _defaults = {}
      /* istanbul ignore else */
      if (Array.isArray(this.defaults)) {
        _keys = this.defaults
        _defaults = {}
      } else if (typeof this.defaults === 'object') {
        _keys = Object.keys(this.defaults)
        _defaults = this.defaults
      } else if (!this.defaults) {
        _keys = []
      } else {
        throw new Error(`Unknown object set for defaults: ${typeof this.defaults}`)
      }

      this._settings = Object.assign({}, _defaults)

      let _initSettings = {}
      let _defaultPromises = {}

      let bindKey = key => {
        if (this[key]) {
          _initSettings[key] = this[key]
        } else if (!this.hasAttribute(key)) {
          /* This is going to run initial render with
             the default setting.
          */
          if (typeof this._settings[key] === 'function') {
            this._settings[key] = this._settings[key]()
            _defaultPromises[key] = this._settings[key]
          }
        }
        Object.defineProperty(this, key, {
          get: () => this._settings[key],
          set: value => {
            if (Array.isArray(value)) {
              value = observed(value)
            }
            if (typeof _defaults[key] === 'boolean') {
              if (value === 'true') value = true
              if (value === 'false') value = false
            }
            this._settings[key] = value
            if (this._waits[key]) {
              while (this._waits[key].length) {
                let [resolve] = this._waits[key].shift()
                resolve(value)
              }
            }
            this._render()
          }
        })

        if (typeof _defaults[key] === 'boolean' &&
            this.hasAttribute(key) &&
            typeof this.getAttribute(key) === 'undefined'
            ) {
          this[key] = !_defaults[key]
        } else {
          if (this.hasAttribute(key)) {
            this[key] = this.getAttribute(key)
          }
        }
      }

      _keys.forEach(bindKey)

      for (let key in _initSettings) {
        this[key] = _initSettings[key]
      }

      observer(this, attributes => {
        for (let key in attributes) {
          if (_keys.includes(key)) {
            this[key] = attributes[key]
          }
        }
      })
      await Promise.all(values(_defaultPromises))
      for (let key in _defaultPromises) {
        this[key] = await _defaultPromises[key]
      }

      let waitFor = key => {
        if (!_keys.includes(key)) {
          this.addSetting(key, this[key])
        }
        if (typeof this[key] !== 'undefined') {
          return Promise.resolve(this[key])
        }
        return new Promise((resolve, reject) => {
          if (!this._waits[key]) this._waits[key] = []
          this._waits[key].push([resolve, reject])
        })
      }

      this.addSetting = (key, value) => {
        if (!_keys.includes(key)) {
          bindKey(key)
          _keys.push(key)
        }
        if (typeof value !== 'undefined') {
          this[key] = value
        }
      }
      this.waitFor = waitFor
      this._settings.waitFor = waitFor

      this._render()
    })

    /* Setup ShadowDOM Immediately so that display of
       existing innerHTML is not shown.
    */
    let shadowRoot = this.attachShadow({mode: 'open'})
    shadowRoot.innerHTML = this.shadow
  }

  /* Fix casing of attribute set/get */
  setAttribute (key, value) {
    this.setAttributeNS(null, key, value)
  }
  getAttribute (key) {
    for (let atr of this.attributes) {
      if (atr.nodeName === key) return atr.nodeValue
    }
    return undefined
  }

  set shadow (value) {
    this.shadowRoot.innerHTML = value
  }

  nextRender () {
    return new Promise((resolve, reject) => {
      this._afterRender.push([resolve, reject])
    })
  }

  /* Internal batch renderer */
  async _render () {
    /* timeout is to defer rendering
       until after multiple attributes get
       set in a single tick.

       rerender is to force another render if
       the settings change while rendering is
       taking place.
    */
    //
    if (this._rendering) {
      this._rerender = true
      return
    }
    if (this._timeout) return
    this._timeout = setImmediate(async () => {
      this._timeout = null
      this._rendering = true

      if (!this.renderElement) {
        this.renderElement = document.createElement('render')
        this.renderElement.setAttribute('slot', 'render')
        this.appendChild(this.renderElement)
      }
      if (this.contains(this.renderElement)) {
        this.removeChild(this.renderElement)
      }
      let html = this.innerHTML
      this.appendChild(this.renderElement)
      let settings = Object.assign({}, this._settings)
      let value = await this.render(settings, html)

      if (this._rerender) {
        this._rerender = false
        this._rendering = false
        return this._render()
      }

      if (this.renderElement === value) {
        /* noop, user is directly manipulating the render element */
      } else if (value instanceof HTMLElement) {
        value.setAttribute('slot', 'render')
        this.renderElement.parentNode.removeChild(this.renderElement)
        this.appendChild(value)
        this.renderElement = value
      } else if (typeof value === 'string') {
        this.renderElement.innerHTML = value
      } else if (!value) {
        this.renderElement.innerHTML = ''
      } else {
        // noop
      }
      this._rendering = false

      while (this._afterRender.length) {
        this._afterRender.shift()[0](this.renderElement)
      }
    }, 0)
  }
  get shadow () {
    return `
    <style>
    :host {
      margin: 0 0 0 0;
      padding: 0 0 0 0;
    }
    ::slotted([slot="render"]) {
      margin: 0 0 0 0;
      padding: 0 0 0 0;
    }
    </style>
    <slot name="render"></slot>
    `
  }
}

module.exports = RZA
