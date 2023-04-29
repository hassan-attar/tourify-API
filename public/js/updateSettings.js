import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatemypassword'
        : '/api/v1/users/updateme';
    const res = await axios({
      url,
      method: 'PATCH',
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `Your ${type} has been updated.`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
