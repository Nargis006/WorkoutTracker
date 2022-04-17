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

class Workout{
    id = new Date().getTime()+''.slice(-10);
    date = new Date();
    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on 
        ${months[this.date.getMonth()]} ${this.date.getDate()} `
    }
}
class Running extends Workout{
    type = 'running';
    constructor(coords, distance, duration, cadence){
        super(coords,distance,duration);
        this.cadence = cadence;
        this.calPace();
        this._setDescription();
    }
    calPace(){
        //min/Km
        this.pace = this.duration/this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain){
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this.calSpeed();
        this._setDescription();
    }

    calSpeed(){
        //in KM/h
        this.speed = this.distance/(this.duration/60);
        return this.speed;
    }
}

class App{
    #mapEvent;
    #map;
    #workouts= [];
    #mapZoomlevel=13;
    constructor(){
        this._getCurrentLocation();
        this._getWorkoutFromLocalStorage();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change',this._toggleDropdown);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getWorkoutFromLocalStorage(){
        const data = JSON.parse(localStorage.getItem("workouts"));
        if(!data) return;
        this.#workouts = data;
        this.#workouts.forEach(work=>{this._renderWorkout(work)});
    }
     _getCurrentLocation(){
         if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
            (err)=>console.log(new Error('err')));
         }
     }
     _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        if(!workoutEl) return;
        const workout = this.#workouts.find(x=>x.id === workoutEl.dataset.id);
        this.#map.setView(workout.coords,this.#mapZoomlevel, {
            animate:true,
            pan:{
                duration:1
            }
        });
     }
     _loadMap(position){
        const {latitude: lat,longitude: long} = position.coords;
        this.#map = L.map('map').setView([lat, long], this.#mapZoomlevel);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">Narjid Workout Tracker</a>'
        }).addTo(this.#map);
        this.#map.on('click', this._showForm.bind(this));
        this.#workouts?.forEach(work=>
            {
                this._renderworkoutMarker(work);
            });
    };
     _clearFields(){
        inputDistance.value = inputDuration.value=inputCadence.value = inputElevation.value = '';
     }

     _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
     }
     _renderworkoutMarker(workout){
        const type = inputType.value;
        L.marker(workout.coords).addTo(this.#map).bindPopup(new L.Popup({
            autoClose:false,
            maxWidth:200,
            maxHeight: 150,
            closeOnClick:false,
            className:`${type}-popup`
        }).setContent(`${workout.type === 'running' ? `🏃‍♂️` : `🚴‍♀️`}${workout.description} km`)).openPopup();
     };

     _renderWorkout(workout){
    const runningCyclingHtml = `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">
        ${workout.type === 'running' ? 
        `${workout.pace?.toFixed(1)}` : `${workout.speed?.toFixed(1)}`}
        </span>
        <span class="workout__unit">${workout.type === 'running' ?
        `min/Km` : `Km/h`}</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ?
        `🦶🏼` : `⛰`}</span>
        <span class="workout__value">${workout.type === 'running' ?
         `${workout.cadence}` : `${workout.elevationGain}`}</span>
        <span class="workout__unit">${workout.type === 'running' ?
        `spm` : `m`}</span>
      </div>`;
        const html = 
        `<li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
                workout.type === 'running' ? `🏃‍♂️` : `🚴‍♀️`}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          ${runningCyclingHtml}
          </li>`;
          form.insertAdjacentHTML('afterend',html);
          this._hideForm();
     };
     _newWorkout(e){
        const vaidInputs = (...inputs)=>  inputs.every(inp=> !Number.isFinite(inp));
        //by default on form submit page reloads
        e.preventDefault();
        const {lat, lng} = this.#mapEvent.latlng;
        const type = inputType.value;
        let workout;
        const distance = inputDistance.value;
        const duration = inputDuration.value;
        if(type === 'running'){
            const cadence = inputCadence.value;
            if(!vaidInputs([distance,duration,cadence]))
                return alert('input should be a number');
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        if(type === 'cycling'){
            const elevation = inputElevation.value;
            if(!vaidInputs([distance,duration,elevation])) 
                return alert('input should be a number');
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        this._renderworkoutMarker(workout);
        this._renderWorkout(workout);
        this.#workouts?.push(workout);
        this._setWorkoutToLocalStorage();
     }
     _toggleDropdown(){
            //toggle adds class if not present and remove if present
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
            inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
     }
     _hideForm(){
         this._clearFields();
         form.style.display = 'none';
         form.classList.add('hidden');
         setTimeout(() => form.style.display = 'grid', 1000);
     }
     _setWorkoutToLocalStorage(){
        localStorage.setItem("workouts",JSON.stringify(this.#workouts));
    }

    clearLocalStorage(){
        localStorage.clear('workouts');
        location.reload();
    }
};
const appObj = new App();
