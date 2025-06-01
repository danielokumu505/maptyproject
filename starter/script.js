'use strict';

class Workout {
  date = new Date();

  id = (Date.now() + '').slice(-10); //unique identifier

  clicks = 0;

  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates; // [latitude,longitude]
    this.distance = distance; // in km
    this.duration = duration; // in minutes
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April',
       'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration); //initialises 'this' keyword
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coordinates, distance, duration, elevationGain) {
    super(coordinates, distance, duration); //initialises 'this' keyword
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
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
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    //get user's position
    this._getPosition(); //gets executed as soon as new child object is created

    //get data from local storage
    this._getLocalStorage();

    //attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this)); //in the event handler, this keyword points to form
    //....and must therefor be reassigned to App object/class using bind method

    inputType.addEventListener('change', this._toggleElavationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  } //the constructor function gets executed as soon as new child object 'app' is created

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

    this.#map = L.map('map').setView(coordinates, this.#mapZoomLevel);

    //using leaflet library
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    }); //the map has to load before workout marker is rendered on map.
  }

  _showForm(event) {
    this.#mapEvent = event;

    // form.style.display = 'grid';

    form.classList.remove('hidden');

    inputDistance.focus(); //puts cursor on input field
  }

  _hideForm() {
    //hide form and clear input fields after submission

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none'; //prevents animation when form is being hidden

    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElavationField() {
    //finds closest parent element and toggles the parent classes
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    //finds closest parent element and toggles the parent classes
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    event.preventDefault(); //prevents loading of page after form submission

    //input validation
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

    //render workout on map as a marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    //hide form
    this._hideForm();

    //set local storage to all workouts

    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coordinates)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250, //check leaflet.js documentation
          minWidth: 100, //check leaflet.js documentation
          autoClose: false, //check leaflet.js documentation
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        ` ${workout.type === 'running' ? '🏃' : '🚴'}  ${workout.description} `
      ) //refer to leaflet.js documentation
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚴'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
    </li> 
   `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(event) {
    const workoutElement = event.target.closest('.workout'); //targets parent element with class 'workout'

    if (!workoutElement) {
      return; //guard clause
    }

    const workout = this.#workouts.find(
      work => work.id === workoutElement.dataset.id
    ); //array method to find workout with the given condition

    this.#map.setView(workout.coordinates, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    }); //using leaflet library methods

    //using the public interface
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); //accepts second parameter as string
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    //note : //objects retrieved from local storage loose their prototype hence loose their prototype inheritance

    if (!data) {
      return;
    } //guard clause if there is no data in the local storage

    this.#workouts = data;

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    }); //objects retrieved from local storage loose their prototype hence loose their prototype inheritance
  }

  reset() {
    localStorage.removeItem('workouts'); //deletes local storage data
    location.reload(); //reloads the current page
  } //to reset application on the console
}

const app = new App();
