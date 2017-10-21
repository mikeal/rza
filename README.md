# RZA 

Create simple HTML elements

<p>
  <a href="https://www.patreon.com/bePatron?u=880479">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button.png" height="40px" />
  </a>
</p>

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


## render() function.

The render function you define will be called whenever relevant state
(settings) are altered.

Returning a string will reset the innerHTML of the `<render>` element.

Returning the previous element value is a `noop`, RZA assumes that because
you are returning the prior element you have manipulated it correctly.

Returning an HTML Element will append that element as a child and put
it in the `render` slot of the shadowDOM so that it can be seen.

## default types.

Setting an array for defaults defines those property names as settings
but with no real defaults.

This means that element attributes and properties of these names will
be treated as settings, and alterations to them will cause re-renders.

```javascript
class MyElement extends RZA {
  get defaults () {
    return ['propname']
  }
}
```

Functions (sync and async) can be used as dynamic initializers for
default properties.

```javascript
class MyElement extends RZA {
  get defaults () {
    return { prop: async () => 'example' }
  }
}
```
