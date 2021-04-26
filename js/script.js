'use strict';

class Workout {
    //not implemented yet in JS, Stage 3
  date = new Date();
   //in a real example,  we should use a library to get id's
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
//every object gets this method and so in each of the workouts, we can now increase that number of clicks
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

///////////////////////////////////////
// APPLICATION ARCHITECTURE
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
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
      //❗ pain point of working with event listeners in classes. We have to use the    $bind() method in order to not get undefined. We want the this keyword to point to the object itself, in this case the App object
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    //leaflet set-up
//in our html we have an element with the id#map
//L is a namespace the library gives us. It has a copule of methods
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    //openstreetmap is open sourced
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
        //the method $on() comes from the Leaflet library. it is not a Js method
    //we use this method instead of the addEventListener
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';
//first hide the form. because the form has an animation
    form.style.display = 'none';
    //then we have to add the hidden class
    form.classList.add('hidden');
    //we have to set the display back to grid  because of the animation    
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
// $.closest select the closest method, which selects parents not children
// $.toggle by toggling the same class $form__row--hidden on both of them, we make sure that one is always hidden and the other visible
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

    // newWorkout is kind of a delegating method
  _newWorkout(e) {
       //HELPER FUNCTION. checks if the inputs are numbers 
    //❗ when we use (...) we get an array. Now we want to loop through the array and check if all of them are positive 
    // $every loops through the array
    // $isFinite determines whether the passed value is a finite number. If  needed, the parameter is first converted to a number.
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

        //HELPER FUNCTION
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //❗ In Modern JS, the if else is not much used anymore. Rather we use 2 if statements

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      //for the data to be valid, each of them should be a number
      // ❗ In Modern JS, we use a guard clause. What that means is that we will check for the opposite of what we're originally interested in. If that opposite is true, then we simply return the function immediately
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

         //when you go down a mountain you can put a negative value in the elevation, that is why we do not put that parameter in the !allPositive here

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }


  //Leaflet docs: https://leafletjs.com/reference-1.7.1.html#marker
//https://leafletjs.com/reference-1.7.1.html#popup
//.setPopupContent gives the pop-up some content
//ALL THE METHODS IN LEAFLET RETURNS $THIS, WHICH MAKES ALL OF THEM CHAINABLE
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
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


    //we use toFixed() because JS calculates the value, so we want to round it up
    if (workout.type === 'running')
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
      </li>
      `;

    if (workout.type === 'cycling')
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
 // ❗ insert the string at the end of the form
    form.insertAdjacentHTML('afterend', html);
  }

  // ❗ we need the event because we have to match the element that we're actually looking for. $e.target.closest --> we look for the closest workout parent. $closest is esentially the opposite of a query selector.  We're looking for the element with the class 'workout'. Wherever the click happens in the element, all of it will end up in this 'li' element with the 'workout' class, because from the element that is clicked, we will move up to this exact element, using the 'closest' method
  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');

    //if there is no 'workout' element, simply return. This is a guard clause
    if (!workoutEl) return;

    //get the workout data out of the workouts array
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );


    //in Leaflet, the setView() method to get you to the coordinates. It takes 02 arguments: the coordinates, and the zoom level. Then we pass an object of options
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

 
    // it is disabled because when we convert to string and then to object, we basically loose the chain
    // using the public interface
    // workout.click();
  }

    //LocalStorage is an API that the browser provides for us. LocalStorage is a simple key value store. $LocalStorage is recommended just for small amounts of data 
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // $JSON.parse converts to objects
// ❗ this method is going to be executed right at the very beginning
// at that point the workoutw array is going to be empty
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    //  if we had some data in the LocalStorage then we'll set that workouts array to the data we had before. Esentially we are restoring the data across multiple reloads of the page
    this.#workouts = data;

    //take all the workouts and render them in the list. 
// we use $forEach because we don't want to create a new array
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

    //we'll use it in the console. Remove the workout item from local storage.  We can reload the apge programaticlly. 
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();


/**TODO 
 * Ability to  edit a workout
 * Ability to delete a workout
 * Ability to delete all workouts
 * Ability to sort workouts by a certain field( e.g. distance)
 * More realistic error and confirmation messages (instead of  the alert)
 * Ability to position the map to show all workouts [vey hard]. Leaflet library
 * Ability to draw lines and spaes innstead of just points [vey hard]
 * Geocode location from coordinates("Run in Faro, Portugal")[async]
 * Display weather data for workout time & place 
*/