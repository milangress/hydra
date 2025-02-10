import { EditorView } from "@codemirror/view"

export const completionTheme = EditorView.baseTheme({
  ".cm-completionIcon.src::before": { 
    content: '"🏞️"', marginRight: "5em"
  },
  ".cm-completionIcon.coord::before": {
    content: '"💥"', marginRight: "5em"
  },
  ".cm-completionIcon.color::before": {
    content: '"🤒"', marginRight: "5em" 
  },
  ".cm-completionIcon.combine::before": {
    content: '"💯"', marginRight: "5em"
  },
  ".cm-completionIcon.combineCoord::before": {
    content: '"🍣"', marginRight: "5em"
  },
  ".cm-completionIcon.external::before": {
    content: '"⛓️"', marginRight: "5em"
  },
  ".cm-completionIcon.output::before": {
    content: '"🌍"', marginRight: "5em"
  }
})