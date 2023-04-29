// console.log('hello from the parcel');
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

const mapEl = document.getElementById('map');
const loginFormEl = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataFormEl = document.querySelector('.form-user-data');
const userPasswordFormEl = document.querySelector('.form-user-password');
const passwordSaveBtn = document.querySelector('.btn--save-password');
const bookTourBtn = document.getElementById('book-tour');

if (mapEl) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

if (loginFormEl)
  loginFormEl.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
if (userDataFormEl) {
  userDataFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateSettings(form, 'information');
    setTimeout(() => {
      location.reload(true);
    }, 2000);
  });
}
if (userPasswordFormEl)
  userPasswordFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();
    passwordSaveBtn.textContent = 'Updating...';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { currentPassword, password, passwordConfirm },
      'password'
    );
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    passwordSaveBtn.textContent = 'Save password';
  });

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', async function (e) {
    try {
      e.preventDefault();
      this.textContent = 'Processing...';
      const tourId = this.dataset.tourId;
      await bookTour(tourId);
    } catch (err) {
      showAlert('error', err.message);
    }
  });
}
