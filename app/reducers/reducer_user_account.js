import { UPDATE_USER_ACCOUNT } from '../actions'
import { remote } from 'electron'

export default function (state = {}, action) {
  switch (action.type) {
    case UPDATE_USER_ACCOUNT:
      remote.getGlobal('conf').set('enterprise:enabled', action.payload.enterprise)
      remote.getGlobal('conf').set('account', action.payload)
      return action.payload
    default:
  }
  return state
}
