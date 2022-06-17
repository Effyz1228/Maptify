'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  click = 0;

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    //Running on April 14
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  clicks() {
    this.click++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////////////////////////////////////////////////////////////
//App architechture:
class App {
  coords;
  #workouts = [];
  #map;
  #zoomLevel = 13;
  #mapEvent;

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveMap.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Can't access your position!");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    this.coords = [latitude, longitude];
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    this.#map = L.map('map').setView(this.coords, this.#zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapEvt) {
    this.#mapEvent = mapEvt;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    //get the input data
    const type = inputType.value;
    //turn string to number
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //check if data make sense
    const inputValidation = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //if workout=running,create running workout
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !inputValidation(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Please enter a positive number!');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    //if workout=cycling,create cycling workout
    if (inputType.value === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !inputValidation(distance, duration, elevation) ||
        !allPositive(duration, distance)
      )
        return alert('Please enter a positive number!');

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    //push workout to workouts array
    this.#workouts.push(workout);
    //show on map
    this._renderWorkoutMarker(workout);
    //show on workout list
    this._renderWorkoutList(workout);
    //hide the form and clean input fields
    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          className: `${workout.type}-popup`,
          closeOnClick: false,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkoutList(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${
            workout.description
          }Running on April 14</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === 'running') {
      html += `
       <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace}</span>
        <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
        </div>
    </li>
        `;
    }
    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveMap(e) {
    const workoutEL = e.target.closest('.workout');
    if (!workoutEL) return;
    const targetWorkout = this.#workouts.find(work => {
      return work.id === workoutEL.dataset.id;
    });

    this.#map.setView(targetWorkout.coords, this.#zoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    targetWorkout.clicks();
    console.log(targetWorkout);
  }
}

const app = new App();
