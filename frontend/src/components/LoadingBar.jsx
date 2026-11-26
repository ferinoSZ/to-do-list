import { useSyncExternalStore } from 'react'
import { getPendingRequests, subscribeToRequests } from '../services/api.js'

export default function LoadingBar() {
  const pending = useSyncExternalStore(subscribeToRequests, getPendingRequests)
  return <div className="loading-bar" data-active={pending > 0} aria-hidden="true" />
}
