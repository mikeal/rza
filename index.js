/* globals MutationObserver, HTMLElement */

const observer = (element, onAttributes) => {
  var observer = new MutationObserver(mutations => {
    mutations = Array.from(mutations)
    let attributes = Object.assign({},
      ...mutations
      .filter(m => m.type === 'attributes')
      .map(m => m.attributeName)
      .map(attr => {
        let o = {}

        o[attr] = element.getAttribute(attr)
        return o
      })
    )
    onAttributes(attributes)

    mutations.filter(m => m.type === 'characterData').forEach(m => {
      if (element._render && !element._rendering) element._render()
    })

    mutations.filter(m => m.type === 'childList').forEach(m => {
      if (!m.addedNodes.length) return
      if (!element._render || element._rendering) return
      if (m.target.tagName === 'RENDER') return
      // TODO: More filtration, ensure no child or render triggers
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
  constructor () {
    super()
    setTimeout(() => {
      let _defaults = this.defaults || {}
      let _keys = Object.keys(_defaults)
      this._settings = Object.assign({}, _defaults)

      _keys.forEach(key => {
        Object.defineProperty(this, key, {
          get: () => this._settings[key],
          set: value => {
            if (typeof _defaults[key] === 'boolean') {
              if (value === 'true') value = true
              if (value === 'false') value = false
            }
            this._settings[key] = value
            this._render()
          }
        })

        if (typeof _defaults[key] === 'boolean') {
          if (this.hasAttribute(key)) {
            if (this.getAttribute(key) !== 'false' &&
                this.getAttribute(key) !== false) {
              this[key] = true
            } else {
              this[key] = false
            }
          }
        } else {
          if (this.hasAttribute(key)) {
            this[key] = this.getAttribute(key)
          }
        }
      })

      observer(this, attributes => {
        for (let key in attributes) {
          if (_keys.includes(key)) {
            this[key] = attributes[key]
          }
        }
      })

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

  /* Internal batch renderer */
  async _render () {
    /* timeout is to defer rendering
       until after multiple attributes get
       set in a single tick.

       rerender is to force another render if
       the settings change while rendering is
       taking place.
    */
    if (this._timeout) return
    if (this._rendering) {
      this._rerender = true
      return
    }
    this._timeout = setTimeout(async () => {
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

      this.renderElement.innerHTML = ''
      if (typeof value === 'string') {
        this.renderElement.innerHTML = value
      } else {
        this.renderElement.appendChild(value)
      }
      this._rendering = false
    }, 0)
  }
  get shadow () {
    return `
    <style>
    :host {
      margin: 0 0 0 0;
      padding: 0 0 0 0;
    }
    ::slotted(rza-render) {
      margin: 0 0 0 0;
      padding: 0 0 0 0;
    }
    </style>
    <slot name="render"></slot>
    `
  }
}

module.exports = RZA
