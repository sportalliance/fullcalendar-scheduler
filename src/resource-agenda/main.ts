import { createPlugin, ViewSpec } from '@fullcalendar/core'
import { isVResourceViewEnabled } from '@fullcalendar/resource-common'
import { AgendaView } from '@fullcalendar/timegrid'
import ResourceAgendaView from './ResourceAgendaView'


function transformAgendaViewSpec(viewSpec: ViewSpec): ViewSpec {

  if (viewSpec.class === AgendaView && isVResourceViewEnabled(viewSpec)) {
    return {
      ...viewSpec,
      class: ResourceAgendaView
    }
  }

  return viewSpec
}


export { ResourceAgendaView }

export default createPlugin({
  viewSpecTransformers: [ transformAgendaViewSpec ]
})
