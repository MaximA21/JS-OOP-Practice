'use strict';




class Workout {
    date = new Date()
    id = (Date.now() + "").slice(-10)
    // in real project always use external lib for unique ids!!!
    constructor(coords, distance, duration) {
        this.coords = coords // [lat, lng]
        this.distance = distance // in km
        this.duration = duration // in min
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
}

class Running extends Workout {
    type = "running"
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence
        this.calcPace()
        this._setDescription()
    }
    calcPace() {
        // min/km
        this.pace = this.duration / this.distance
        return this.pace
    }
}

class Cycling extends Workout {
    type = "cycling"
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationGain = elevationGain
        this.calcSpeed()
        this._setDescription()
    }

    calcSpeed() {
        //km / h
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

/////////////////////////////////////////////////////////
//                Application Architecture             //
/////////////////////////////////////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map
    #mapEvent

    #workouts = []
    constructor() {
        this._getPosition()

        form.addEventListener("submit", this._newWorkout.bind(this))
        inputType.addEventListener("change", this._toggleElevationField)

    }
    _getPosition () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
    function () {
                    alert("Pls 🥺")
                })
        }
    }
    _loadMap (position) {
            const {latitude} = position.coords
            const {longitude} = position.coords

            this.#map = L.map('map').setView([latitude, longitude], 15);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            this.#map.on("click", this._showForm.bind(this))
    }
    _showForm (mapE) {
        this.#mapEvent = mapE
        form.classList.remove("hidden")
        inputDistance.focus()
    }
    _toggleElevationField () {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden")
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden")
    }
    _newWorkout (evt) {
        evt.preventDefault()

        const validation = (...inputs) => inputs.every(inp => Number.isFinite(inp))
        const allPositive = (...inputs) => inputs.every(inp => inp > 0)

        //get data
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const {lat, lng} = this.#mapEvent.latlng
        let workout

        // create the correct type of workout
        //cycling
        if (type === "cycling") {
            const elevation = +inputElevation.value
            //data validation
            if (!validation(distance, duration, elevation) || !allPositive(distance, duration)) return alert("Invalid input")

            workout = new Cycling([lat, lng], distance, duration, elevation)
        }

        //running
        if (type === "running") {
            const cadence = +inputCadence.value
            //data validation
            if (!validation(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert("Invalid input")
            workout = new Running([lat, lng], distance, duration, cadence)
        }

        //add new object to the array
        this.#workouts.push(workout)

        //render the workout on the map as marker
      this._renderWorkoutMarker(workout)

        //render the new workout in the list
        this._renderWorkout(workout)
        //hide the form

        // clear inout
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ""
    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(workout.type)
            .openPopup()
    }

    _renderWorkout(workkout) {
      const html = `<li class="workout workout--${workkout.type}" data-id="${workkout.id}">
          <h2 class="workout__title">Running on April 14</h2>
          <div class="workout__details">
            <span class="workout__icon">${workkout.type === "running" ? "🏃":"🚴"}</span>
            <span class="workout__value">${workkout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workkout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`
    }
}
const app = new App