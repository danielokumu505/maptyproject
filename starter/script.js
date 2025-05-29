'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  constructor() {
    this._getPosition(); //gets executed as soon as new child object is created

    form.addEventListener('submit', this._newWorkout.bind(this)); //in the event handler, this keyword points to form
    //....and must therefor be reassigned to App object/class using bind method

    inputType.addEventListener('change', this._toggleElavationField);
  } //the constructor function gets executed as soon as new child object is created

  _getPosition() {
    if (navigator.geolocation) {
      console.log(this);
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //'this' points to the current object ie App after binding with bind
        function () {
          alert('Could not get your position');
        }
      ); //geolocation API : accepts two callback functions
      // ...first one called on success and second one called on error
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords; //refer to destructuring. the name of const must be same as name of keys in object
    //...being destructured
    console.log(
      `https://www.google.com/maps/@-${latitude},${longitude},2021m/data`
    );

    const coordinates = [latitude, longitude];

    console.log(this); //in a regular function call, this keyword is set to undefined

    this.#map = L.map('map').setView(coordinates, 13);

    console.log(this.#map);

    //using leaflet library
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(event) {
    this.#mapEvent = event;

    form.classList.remove('hidden');

    inputDistance.focus(); //puts cursor on input field
  }

  _toggleElavationField() {
    //finds closest parent element and toggles the parent classes
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    //finds closest parent element and toggles the parent classes
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    event.preventDefault(); //prevents loading of page after form submision

    //clear input fields after submission
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    //display marker
    const { lat, lng } = this.#mapEvent.latlng; //the name of const must be same as name of keys in object
    //...being destructured
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250, //check leaflet.js documentation
          minWidth: 100, //check leaflet.js documentation
          autoClose: false, //check leaflet.js documentation
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Workout') //refer to leaflet.js documentation
      .openPopup();
  }
}

const app = new App();
