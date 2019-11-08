import { memoize, Calendar, Component, DateMarker, htmlToElement, htmlEscape, DateProfile, renderDateCell, findElements, createFormatter, DateFormatter, computeFallbackHeaderFormat, ComponentContext } from '@fullcalendar/core'
import { buildResourceTextFunc } from '../common/resource-rendering'
import { Resource } from '../structs/resource'
import ResourceApi from '../api/ResourceApi'

export interface ResourceDayHeaderProps {
  dates: DateMarker[]
  dateProfile: DateProfile
  datesRepDistinctDays: boolean
  resources: Resource[] // flattened
  renderIntroHtml?: () => string
}

export default class ResourceDayHeader extends Component<ResourceDayHeaderProps, ComponentContext> {

  private buildDateFormatter = memoize(this._buildDateFormatter)
  private processOptions = memoize(this._processOptions)

  datesAboveResources: boolean
  resourceTextFunc: (resource: Resource) => string
  dateFormat: DateFormatter


  _processOptions(options, calendar: Calendar) {
    this.datesAboveResources = options.datesAboveResources
    this.resourceTextFunc = buildResourceTextFunc(options.resourceText, calendar)
  }


  _buildDateFormatter(columnHeaderFormat, datesRepDistinctDays, dayCnt) {
    return createFormatter(
      columnHeaderFormat ||
      computeFallbackHeaderFormat(datesRepDistinctDays, dayCnt)
    )
  }


  render(props: ResourceDayHeaderProps, context: ComponentContext) {
    let { options, calendar, theme } = context

    this.processOptions(options, calendar)
    this.dateFormat = this.buildDateFormatter(
      options.columnHeaderFormat,
      props.datesRepDistinctDays,
      props.dates.length
    )

    let html

    if (props.dates.length === 1) {
      html = this.renderResourceRow(props.resources)
    } else {
      if (this.datesAboveResources) {
        html = this.renderDayAndResourceRows(props.dates, props.resources)
      } else {
        html = this.renderResourceAndDayRows(props.resources, props.dates)
      }
    }

    let el = htmlToElement(
      '<div class="fc-row ' + theme.getClass('headerRow') + '">' +
        '<table class="' + theme.getClass('tableGrid') + '">' +
          '<thead>' + html + '</thead>' +
        '</table>' +
      '</div>'
    )
    let theadEl = el.querySelector('thead')

    this.processResourceEls(theadEl, props.resources)

    return el
  }


  renderResourceRow(resources: Resource[]): string {
    let cellHtmls = resources.map((resource) => {
      return this.renderResourceCell(resource, 1)
    })

    return this.buildTr(cellHtmls)
  }


  renderDayAndResourceRows(dates: DateMarker[], resources: Resource[]) {
    let dateHtmls = []
    let resourceHtmls = []

    for (let date of dates) {

      dateHtmls.push(
        this.renderDateCell(date, resources.length)
      )

      for (let resource of resources) {
        resourceHtmls.push(
          this.renderResourceCell(resource, 1, date)
        )
      }
    }

    return this.buildTr(dateHtmls) +
      this.buildTr(resourceHtmls)
  }


  renderResourceAndDayRows(resources: Resource[], dates: DateMarker[]) {
    let resourceHtmls = []
    let dateHtmls = []

    for (let resource of resources) {

      resourceHtmls.push(
        this.renderResourceCell(resource, dates.length)
      )

      for (let date of dates) {
        dateHtmls.push(
          this.renderDateCell(date, 1, resource)
        )
      }
    }

    return this.buildTr(resourceHtmls) +
      this.buildTr(dateHtmls)
  }



  // Cell Rendering Utils
  // ----------------------------------------------------------------------------------------------


  // a cell with the resource name. might be associated with a specific day
  renderResourceCell(resource: Resource, colspan: number, date?: DateMarker) {
    const { dateEnv } = this.context

    return '<th class="fc-resource-cell"' +
      ' data-resource-id="' + resource.id + '"' +
      (date ?
        ' data-date="' + dateEnv.formatIso(date, { omitTime: true }) + '"' :
        '') +
      (colspan > 1 ?
        ' colspan="' + colspan + '"' :
        '') +
    '>' +
      htmlEscape(
        this.resourceTextFunc(resource)
      ) +
    '</th>'
  }


  // a cell with date text. might have a resource associated with it
  renderDateCell(date: DateMarker, colspan: number, resource?: Resource) {
    let { props } = this

    return renderDateCell(
      date,
      props.dateProfile,
      props.datesRepDistinctDays,
      props.dates.length * props.resources.length,
      this.dateFormat,
      this.context,
      colspan,
      resource ? 'data-resource-id="' + resource.id + '"' : ''
    )
  }


  buildTr(cellHtmls: string[]) {
    if (!cellHtmls.length) {
      cellHtmls = [ '<td>&nbsp;</td>' ]
    }

    if (this.props.renderIntroHtml) {
      cellHtmls = [ this.props.renderIntroHtml() ].concat(cellHtmls)
    }

    if (this.context.isRtl) {
      cellHtmls.reverse()
    }

    return '<tr>' +
      cellHtmls.join('') +
      '</tr>'
  }


  // Post-rendering
  // ----------------------------------------------------------------------------------------------


  // given a container with already rendered resource cells
  processResourceEls(theadEl: HTMLElement, resources: Resource[]) {
    let { calendar, isRtl, view } = this.context

    findElements(theadEl, '.fc-resource-cell').forEach((node, col) => { // does DOM-order

      col = col % resources.length
      if (isRtl) {
        col = resources.length - 1 - col
      }

      let resource = resources[col]

      calendar.publiclyTrigger('resourceRender', [
        {
          resource: new ResourceApi(calendar, resource),
          el: node, // head <td>
          view
        }
      ])
    })
  }

}
