'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
  date = new Date();

  id = (Date.now() + '').slice(-10); //unique identifier

  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates; // [latitude,longitude]
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }
}

class Running extends Workout {
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration); //initialises 'this' keyword
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coordinates, distance, duration, elevationGain) {
    super(coordinates, distance, duration); //initialises 'this' keyword
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

////////////////////////////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECURE

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
  #workouts = [];
  constructor() {
    this._getPosition(); //gets executed as soon as new child object is created

    form.addEventListener('submit', this._newWorkout.bind(this)); //in the event handler, this keyword points to form
    //....and must therefor be reassigned to App object/class using bind method

    inputType.addEventListener('change', this._toggleElavationField);
  } //the constructor function gets executed as soon as new child object is created

  _getPosition() {
    if (navigator.geolocation) {
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

    const coordinates = [latitude, longitude];

    //in a regular function call, this keyword is set to undefined

    this.#map = L.map('map').setView(coordinates, 13);

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
    event.preventDefault(); //prevents loading of page after form submission

    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const allPositive = (...inputs) => inputs.every(input => input > 0);

    //Get data from the form
    const type = inputType.value;

    const distance = +inputDistance.value;

    const duration = +inputDuration.value;

    const { lat, lng } = this.#mapEvent.latlng; //the name of const must be same as name of keys in object

    let workout;

    //if activity is running,create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if activity is cycling,create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    //render workout on map as a marker

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

    //render workout on list

    //hide form and clear input fields after submission

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }
}

const app = new App();
