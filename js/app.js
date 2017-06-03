(function(global) {


	var _Api = {

		selectedLocation: {
			lat: '',
			long: ''
		},

		init: function() {
			// this._detectGeolocation();

			if (navigator.geolocation) {
           		navigator.geolocation.getCurrentPosition(
           			this.getForecast,
           			null);
			}
		},

		initCitySearch: function() {
			"https://query.yahooapis.com/v1/public/yql?q=select+*+from+geo.places.descendants+where+ancestor_woeid={yourcountywoeid}+and+placetype='Town'"
		},

		getForecast: function (position) {
			var long = position.coords.longitude;
			var lat = position.coords.latitude;

			var locationQuery = escape('select * from weather.forecast where woeid in (SELECT woeid FROM geo.places WHERE text = "('+ lat + ',' + long + ')") and u="c"');
    		url = "https://query.yahooapis.com/v1/public/yql?q=" + locationQuery + "&format=json";
			
			var method = 'GET';
		
			var xhr = new XMLHttpRequest();
		    xhr.open(method, url, true);

	        xhr.onload = function() {
	            if (this.status >= 200 && this.status < 300) {
	                console.log(JSON.parse(xhr.response))	;
	            } else {
	                reject({
	                    status: this.status,
	                    statusText: xhr.statusText
	                });
	            }
	        };

	        xhr.send();
	    }
	}


	var WFApp = (function(){

		function _configs() {
			return {
				daysCount: 7,
				weekday: ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'],
				months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
			}
		}

		function _getWeekday(index)  {
			return _configs().weekday[index];
		}

		function _getMonthName(index)  {
			return _configs().months[index];
		}

		function _getDaysEls() {
			return document.querySelectorAll('.day');
		}

		function _getFirstDayEl() {
			return document.querySelector('.day');
		}

		function _getCityEl() {
			return document.querySelector('#selectedLocation');
		}

		function _getForecastEl() {
			return document.querySelector('.forecast-wrap');
		}

		function _selectDay(el) {
			Array.prototype.forEach.call(_getDaysEls(), function (el) {
				el.classList.remove('selected');
			})

			el.classList.add('selected');
		}

		function _getDates() {
			var daysCount = _configs().daysCount,
				dates = [];

			for (var i = daysCount - 1; i >= 0; i--) {
				var curDate = curDate || new Date(),
					nextDate = new Date(new Date().setDate(curDate.getDate() + 1));

				dates.push({
					date: _getMonthName(curDate.getMonth()).toUpperCase() + ' ' + curDate.getDate(),
					day: _getWeekday(curDate.getDay()),
					id: curDate.getDate() + '-' + (curDate.getMonth() + 1) + '-' + curDate.getFullYear()
				});

				curDate = nextDate;
			}

			return dates;
		}

		function _getCalendarHtml() {
			var dates = _getDates(),
				calendarUl = document.createElement('UL');
			calendarUl.classList.add('forecast-calendar');

			dates.forEach(function(day) {
				calendarUl.appendChild(_decorateDay(day));
			});

			return calendarUl;
		}

		function _createCalendar() {
			_getForecastEl().appendChild(_getCalendarHtml());
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
			weatherConditionI.classList.add('wi-yahoo-32');

			var weatherIconWrapP = document.createElement('P');
			weatherIconWrapP.classList.add('weather-icon-wrap');
			weatherIconWrapP.appendChild(weatherConditionI);



			dayLi.appendChild(weekdayP);
			dayLi.appendChild(dateDayP);
			dayLi.appendChild(weatherIconWrapP);

			return dayLi;
		}

		var _eventHandler = {
			handleCityChange: function() {
				_getCityEl().addEventListener('change', function() {
					console.log(this.value);
				});
			},

			handleDateSelect: function() {
				Array.prototype.forEach.call(_getDaysEls(), function (el) {
					el.addEventListener('click', function() {
						_selectDay(this);
					});
				})
			}
		}

		function initApp() {
			_Api.init();

			_createCalendar();
			_eventHandler.handleCityChange();
			_eventHandler.handleDateSelect();
			_getFirstDayEl().dispatchEvent(new Event('click'));
		}

		return {
			init: initApp
		}
	})();

	if (!global.WFApp) global.WFApp = WFApp;

})(window);