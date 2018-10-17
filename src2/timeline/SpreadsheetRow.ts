import { htmlToElement, htmlEscape, createElement } from 'fullcalendar'
import SimpleComponent from './SimpleComponent'
import { Resource } from '../structs/resource'

export interface SpreadsheetRowProps {
  resource: Resource
  rowSpans: number[]
  depth: number
  hasChildren: boolean
  colSpecs: any
}

export default class SpreadsheetRow extends SimpleComponent {

  tr: HTMLElement

  setTr(tr: HTMLElement) {
    this.tr = tr
  }

  render(props: SpreadsheetRowProps) {
    // TODO: put in wrapper func

    let { tr } = this
    let theme = this.getTheme()
    let { resource, rowSpans, colSpecs } = props

    tr.setAttribute('data-resource-id', resource.resourceId)

    for (let i = 0; i < colSpecs.length; i++) {
      let colSpec = colSpecs[i]
      let rowSpan = rowSpans[i]

      if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
        continue
      } else if (rowSpan == null) {
        rowSpan = 1
      }

      const input = // the source text, and the main argument for the filter functions
        colSpec.field ?
          resource[colSpec.field] || null :
          resource

      const text =
        typeof colSpec.text === 'function' ?
          colSpec.text(resource, input) : // the colspec provided a text filter function
          input

      let contentEl = htmlToElement(
        '<div class="fc-cell-content">' +
          (colSpec.isMain ? this.renderGutterHtml(props.depth) : '') +
          '<span class="fc-cell-text">' +
            (text ? htmlEscape(text) : '&nbsp;') +
          '</span>' +
        '</div>'
      )

      if (typeof colSpec.render === 'function') { // a filter function for the element
        contentEl = colSpec.render(resource, contentEl, input) || contentEl
      }

      const td = createElement('td', {
        className: theme.getClass('widgetContent'),
        rowspan: rowSpan
      }, contentEl)

      // the first cell of the row needs to have an inner div for setTrInnerHeight
      if (colSpec.isMain) {
        td.appendChild(
          createElement('div', null, td.childNodes) // inner wrap
        )
      }

      tr.appendChild(td)
    }
  }

  /*
  Renders the HTML responsible for the subrow expander area,
  as well as the space before it (used to align expanders of similar depths)
  */
 renderGutterHtml(depth) {
    let html = ''

    for (let i = 0; i < depth; i++) {
      html += '<span class="fc-icon"></span>'
    }

    html +=
      '<span class="fc-expander-space">' +
        '<span class="fc-icon"></span>' +
      '</span>'

    return html
  }

}
