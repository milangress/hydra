import { ViewPlugin, Decoration, EditorView, WidgetType } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"

// Effect to update a number value
const updateNumberEffect = StateEffect.define()

// Widget class for the draggable number
class DraggableNumberWidget extends WidgetType {
  constructor(value, from, to) {
    super()
    this.value = value
    this.from = from
    this.to = to
  }

  eq(other) {
    return other.value === this.value && 
           other.from === this.from && 
           other.to === this.to
  }

  toDOM() {
    const span = document.createElement("span")
    span.textContent = this.value
    span.className = "cm-draggable-number"
    
    let isDragging = false
    let startX = 0
    let startValue = 0
    
    span.addEventListener("mousedown", (e) => {
      isDragging = true
      startX = e.clientX
      startValue = parseFloat(this.value)
      span.classList.add("dragging")
      e.preventDefault()
      
      const onMouseMove = (e) => {
        if (!isDragging) return
        
        const delta = (e.clientX - startX) / 2 // Adjust sensitivity here
        const newValue = (startValue + delta).toFixed(2)
        span.textContent = newValue
        
        // Dispatch effect to update the actual editor content
        span.dispatchEvent(new CustomEvent("updateValue", {
          detail: { value: newValue, from: this.from, to: this.to }
        }))
      }
      
      const onMouseUp = () => {
        isDragging = false
        span.classList.remove("dragging")
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }
      
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    })
    
    return span
  }
}

// The main plugin
export const draggableNumbers = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.createDecorations(view)
    this.handleUpdateValue = this.handleUpdateValue.bind(this)
    view.dom.addEventListener("updateValue", this.handleUpdateValue)
  }

  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.createDecorations(update.view)
    }
  }

  destroy(view) {
    view.dom.removeEventListener("updateValue", this.handleUpdateValue)
  }

  handleUpdateValue(event) {
    const { value, from, to } = event.detail
    this.view.dispatch({
      changes: { from, to, insert: value }
    })
  }

  createDecorations(view) {
    const widgets = []
    const numberRegex = /-?\d*\.?\d+/g
    
    for (const { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to)
      let match
      
      while ((match = numberRegex.exec(text)) !== null) {
        const start = from + match.index
        const end = start + match[0].length
        
        // Skip if inside a string or comment
        const token = view.state.tree.resolveInner(start).type
        if (token.name.includes("String") || token.name.includes("Comment")) {
          continue
        }
        
        widgets.push(Decoration.replace({
          widget: new DraggableNumberWidget(match[0], start, end),
          inclusive: true
        }).range(start, end))
      }
    }
    
    return Decoration.set(widgets)
  }
}, {
  decorations: v => v.decorations,

  provide: plugin => EditorView.atomicRanges.of(view => {
    return view.plugin(plugin)?.decorations || Decoration.none
  })
})

// Theme extension for styling
export const draggableNumbersTheme = EditorView.theme({
  ".cm-draggable-number": {
    cursor: "ew-resize",
    borderRadius: "2px",
    padding: "0 2px",
    background: "rgba(255,255,255,0.1)",
  },
  ".cm-draggable-number.dragging": {
    background: "rgba(255,255,255,0.2)",
  }
}) 