(function(global) {

	var Geo = (function() {

		function requestAccess(apiCall, callback, defaultLat, defaultLong) {
			if (navigator.geolocation) {
           		navigator.geolocation.getCurrentPosition(
           			function(position) {
           				apiCall(position.coords.latitude, position.coords.longitude).then(function(a) {
           					callback(a);
           				});
           			}, 

           			function(error) {
						apiCall(defaultLat, defaultLong).then(function(a) {
           					callback(a);
           				});
           			},

           			{ timeout: 5000 }
           		);
			} else {
				apiCall(defaultLat, defaultLong).then(function(a) {
   					callback(a);
   				});
			}
		}

		return {
			requestAccess: requestAccess
		}
	})();

	if (!global.Geo) global.Geo = Geo;

	var Api = (function() {

		function getForecastPromise(lat, long) {

			if (!lat && !long) {

			}

			var method = 'GET';

			var __locationQuery =
				'SELECT * FROM weather.forecast ' +
				'WHERE woeid IN (' +
					'SELECT woeid FROM geo.places ' +
					'WHERE text = "('+ lat + ',' + long + ')") ' +
				'AND u="c"';

    		var url = 'https://query.yahooapis.com/v1/public/yql?q=' + 
    			escape(__locationQuery) + 
    			'&format=json&d=5';

			return new Promise(function(resolve, reject) {

				var xhr = new XMLHttpRequest();

			    xhr.open(method, url, true);

		        xhr.onload = function() {
		            if (this.status >= 200 && this.status < 300) {
		                resolve(JSON.parse(xhr.response));
		            } else {
		                reject({
		                    status: this.status,
		                    statusText: xhr.statusText
		                });
		            }
		        };

		        xhr.send();
			});

	    }
	    

        return {
        	getForecast: getForecastPromise
        }
	})();

	if (!global.Api) global.Api = Api;


	var WFApp = (function(){

		var forecastData = {};

		/* OPTIONS */

		var _options = {
			el: 'body',
			daysCount: 5,
			weekdays: ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'],
			months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			cities: [{ title: 'Yerevan', lat: '40.177200', long: '44.503490' }]
		};

		// setter

		function _mapOptions(options) {
			for (option in options) {
				if (_options[option]) {
					_options[option] = options[option];
				}
			}
		}

		// getters

		function _getWeekdayCaption(index)  {
			return _options.weekdays[index];
		}

		function _getMonthCaption(index)  {
			return _options.months[index];
		}

		/* END: OPTIONS */

		function _bootstrap(data, partialRendering_) {
			var forecasts = data.query.results.channel.item.forecast.splice(0, _options.daysCount);

			WFApp.forecastData = Object.assign({}, forecasts);

			_createInterface(
				forecasts,
				partialRendering_
			);

			_getDaysEls()[0].dispatchEvent(new Event('click'));
		}

		/* INTERFACE */

		function _createInterface(data, partial_) {
			if (!partial_) {
				var locationHtml = _createLocationSectionHtml();
			}
			var calendarHtml = _createCalendarSectionHtml(data);
			var detailsHtml = _createDetailsSectionHtml();
			
			var el = document.querySelector(_options.el);
			
			if (!partial_) {
				el.innerHTML = '';
				el.appendChild(locationHtml);
			} else {
				var forecastSection = _getForecastEl();
				forecastSection.parentNode.removeChild(forecastSection);

				var detailsSection = _getDetailsEl();
				detailsSection.parentNode.removeChild(detailsSection);				
			}

			el.appendChild(calendarHtml);
			el.appendChild(detailsHtml);

			if (!partial_) {
				_eventHandler.handleCityChange();
			}

			_eventHandler.handleDateSelect();
		}

		function _createLocationSectionHtml() {
			var heading = '<h2>Forecast for Upcoming %count% days</h2>';

			var wrap = document.createElement('SECTION');
			wrap.classList.add('location-wrap');

			var header = document.createElement('HEADER');
			header.innerHTML = heading.replace(/%count%/, _options.daysCount);

			var selector = document.createElement('DIV');
			selector.classList.add('location-selector');

			var label = document.createElement('LABEL');
			label.setAttribute('for', 'selectedLocation');
			label.innerHTML = 'Location: ';

			var select = document.createElement('SELECT');
			select.setAttribute('id', 'selectedLocation');

			for (var i = 0; i < _options.cities.length; i++) {
				var opt = document.createElement('OPTION');
				opt.innerHTML = _options.cities[i].title;
				opt.setAttribute('data-lat', _options.cities[i].lat);
				opt.setAttribute('data-long', _options.cities[i].long);

				select.appendChild(opt);
			}

			selector.appendChild(label);
			selector.appendChild(select);
			wrap.appendChild(header);
			wrap.appendChild(selector);

			return wrap;
		}

		function _createCalendarSectionHtml(forecast) {
			var dates = _getDates(forecast);

			var wrap = document.createElement('DIV');
			wrap.classList.add('forecast-wrap');

			var calendarUl = document.createElement('UL');
			calendarUl.classList.add('forecast-calendar');

			dates.forEach(function(day) {
				calendarUl.appendChild(_decorateDay(day));
			});

			wrap.appendChild(calendarUl);

			return wrap;
		}

		function _createDetailsSectionHtml() {
			var details = document.createElement('DIV')
			details.classList.add('details');

			return details;
		}

		function _getDates(data) {
			var daysCount = _options.daysCount,
				dates = [];
			for (var i = daysCount - 1; i >= 0; i--) {
				
				var curDate = curDate || new Date();
				var nextDate = new Date(new Date().setDate(curDate.getDate() + 1));

				var __date = _getMonthCaption(curDate.getMonth()).toUpperCase() + ' ' + curDate.getDate(),
					__day = _getWeekdayCaption(curDate.getDay()),
					__id = ('0' + curDate.getDate()).slice(-2) + ' ' + _getMonthCaption(curDate.getMonth()) + ' ' + curDate.getFullYear();

				var __text = data.filter(function(el) {
					if (el.date == __id) {
						return el;
					}
				})[0].text;

				var __code = data.filter(function(el) {
					if (el.date == __id) {
						return el;
					}
				})[0].code;

				dates.push({
					date: __date,
					day: __day,
					id: __id,
					text: __text,
					code: __code
				});

				curDate = nextDate;
			}

			return dates;
		}

		function _decorateDay(data) {
			var dayLi = document.createElement('LI');
			
			dayLi.setAttribute('data-date', data.id);
			dayLi.classList.add('day');

			var weekdayP = document.createElement('P');
			weekdayP.classList.add('weekday');
			weekdayP.innerHTML = data.day;

			var dateDayP = document.createElement('P');
			dateDayP.classList.add('date-day');
			dateDayP.innerHTML = data.date;

			var weatherConditionI = document.createElement('I');
			weatherConditionI.classList.add('wi');
			weatherConditionI.classList.add('wi-yahoo-' + data.code);

			var weatherIconWrapP = document.createElement('P');
			weatherIconWrapP.classList.add('weather-icon-wrap');
			weatherIconWrapP.appendChild(weatherConditionI);

			var textP = document.createElement('P');
			textP.classList.add('text');
			textP.innerHTML = data.text;

			dayLi.appendChild(weekdayP);
			dayLi.appendChild(dateDayP);
			dayLi.appendChild(weatherIconWrapP);
			dayLi.appendChild(textP);

			return dayLi;
		}

		/* END: INTERFACE */

		/* SELECTORS */

		function _getDaysEls() {
			return document.querySelectorAll('.day');
		}

		function _getCityEl() {
			return document.querySelector('#selectedLocation');
		}

		function _getForecastEl() {
			return document.querySelector('.forecast-wrap');
		}

		function _getDetailsEl() {
			return document.querySelector('.details');
		}

		/* END: SELECTORS */

		/* EVENT HANDLING */

		function _selectDay(el) {
			Array.prototype.forEach.call(_getDaysEls(), function (el) {
				el.classList.remove('selected');
			})

			el.classList.add('selected');
		}

		function _updateDetails(data) {
			console.log(data);
			_getDetailsEl().innerHTML =
				'<i class="wi wi-yahoo-' + data.code + '"></i>'
				+ '<p><strong>High:</strong> ' + data.high + '&deg;C</p>'
				+ '<p><strong>Low:</strong> ' + data.low + '&deg;C</p>'
		}

		var _eventHandler = {
			handleCityChange: function() {
				_getCityEl().addEventListener('change', function() {
					var lat = this.options[this.selectedIndex].getAttribute('data-lat'),
						long = this.options[this.selectedIndex].getAttribute('data-long');

					Api.getForecast(lat, long).then(function(data) {
						_bootstrap(data, true);
					});
				});
			},

			handleDateSelect: function() {
				Array.prototype.forEach.call(_getDaysEls(), function (el) {
					el.addEventListener('click', function() {
						var id = this.getAttribute('data-date');
						_selectDay(this);

						var forecastObj = Array.prototype.filter.call(Object.values(WFApp.forecastData), function(el) {
							if (el.date == id) {
								return el;
							}
						});
						
						_updateDetails(forecastObj[0]);
					});
				})
			}
		}

		function initApp(options) {
			_mapOptions(options);

			Geo.requestAccess(
				Api.getForecast, _bootstrap,
				_options.cities[0].lat,
				_options.cities[0].long
			);
		}

		/* END: EVENT HANDLING */

		return {
			forecastData: forecastData,
			init: initApp
		}
	})();

	if (!global.WFApp) global.WFApp = WFApp;

})(window);