import { navigate } from '../../app.js';

export function openCreateEventModal(eventObj = null, onSuccessCallback = null) {
  if (eventObj && eventObj._id) {
    navigate(`#edit-event/${eventObj._id}`);
  } else {
    navigate('#create-event');
  }
}
