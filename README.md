# RZA - Create simple HTML elements

[![Greenkeeper badge](https://badges.greenkeeper.io/mikeal/rza.svg)](https://greenkeeper.io/)

```javascript
const RZA = require('rza')

class MyElement extends RZA {
  get defaults () {
    // default render settings
    return { wrap: false }
  }
  async render (settings, innerHTML) {
    if (settings.wrap) {
      return `<span>${innerHTML}</span>`
    } else {
      return innerHTML
    }
  }
}

window.customElements.define('my-element', MyElement)
```

```html
<!-- Example w/ defaults -->
<my-element>Test</my-element>

<!-- Renders -->

<my-element>
  <render>Test</render>
</my-element>

<!-- Example w/ property set -->

<my-element wrap>Test</my-element>

<!-- Renders -->

<my-element>
  <render>
    <span>Test</span>
  </render>
</my-element>

<!-- Setting properties dynamically cause re-rendering -->

<script>
  let elem = document.querySelector('my-element')
  elem.setAttribute('wrap', false)
  /* or we can just set element properties for the same thing */
  elem.wrap = false
  /* changing the element value ALSO triggers a rerender */
  elem.textContent = 'New Test'
</script>

<!-- Triggers a Render, batched into a single render() call. -->

<my-element>
  <render>New Test</render>
</my-element>
```

See also: [markdown-element](https://github.com/mikeal/markdown-element).
