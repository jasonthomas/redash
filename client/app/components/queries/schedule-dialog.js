import moment from 'moment';
import { map, range, partial } from 'underscore';

import template from './schedule-dialog.html';

const INTERVAL_OPTIONS_MAP = {
  'minute(s)': 60,
  'hour(s)': 24,
  'day(s)': 7,
  'week(s)': 5,
};

function padWithZeros(size, v) {
  let str = String(v);
  if (str.length < size) {
    str = `0${str}`;
  }
  return str;
}

function queryIntervalPicker() {
  const DROPDOWNS = [
    { type: 'count', options: 'countOptions' },
    { type: 'interval', options: 'intervalOptions' },
  ];

  let templateString = '';
  DROPDOWNS.forEach((dropdown) => {
    templateString += `<select ng-model=${dropdown.type} ng-change="updateSchedule(${dropdown.type})" ng-options="c as c for c in ${dropdown.options}"></select>`;
  });

  return {
    restrict: 'E',
    scope: {
      query: '=',
      saveQuery: '=',
    },
    template: templateString,
    link($scope) {
      $scope.intervalOptions = Object.keys(INTERVAL_OPTIONS_MAP);

      if ($scope.query.hasFixedSchedule()) {
        // TODO Fetch this from database:
        $scope.count = 1;
        $scope.interval = Object.keys(INTERVAL_OPTIONS_MAP)[0];
      } else {
        $scope.interval = Object.keys(INTERVAL_OPTIONS_MAP)[0];
        $scope.count = 1;
      }
      $scope.countOptions = range(1, INTERVAL_OPTIONS_MAP[$scope.interval]);

      $scope.updateSchedule = () => {
        $scope.$parent.showTimePicker = Object.keys(INTERVAL_OPTIONS_MAP).slice(2).includes($scope.interval);
        $scope.$parent.showDays = Object.keys(INTERVAL_OPTIONS_MAP).slice(3).includes($scope.interval);

        // Depending on whether minute/hour/day/week was chosen,
        // the acceptable count will vary.
        const acceptableCount = range(1, INTERVAL_OPTIONS_MAP[$scope.interval]);
        $scope.countOptions = acceptableCount;
        if (!acceptableCount.includes($scope.count)) {
          $scope.count = 1;
        }
      };
    },
  };
}

function queryTimePicker() {
  let templateString = '';
  const DROPDOWNS = [
    { type: 'hour', options: 'hourOptions' },
    { type: 'minute', options: 'minuteOptions' },
  ];
  DROPDOWNS.forEach((dropdown) => {
    templateString += `<select ng-model=${dropdown.type} ng-change="updateSchedule(${dropdown.type})" ng-options="c as c for c in ${dropdown.options}"></select>`;
  });

  return {
    restrict: 'E',
    scope: {
      query: '=',
      saveQuery: '=',
    },
    template: templateString,
    link($scope) {
      $scope.hourOptions = map(range(0, 24), partial(padWithZeros, 2));
      $scope.minuteOptions = map(range(0, 60, 5), partial(padWithZeros, 2));

      if ($scope.query.hasFixedSchedule()) {
        const parts = $scope.query.scheduleInLocalTime().split(':');
        $scope.minute = parts[1];
        $scope.hour = parts[0];
      } else {
        $scope.minute = '15';
        $scope.hour = '00';
      }

      $scope.updateSchedule = () => {
        const newSchedule = moment().hour($scope.hour)
          .minute($scope.minute)
          .utc()
          .format('HH:mm');

        if (newSchedule !== $scope.query.schedule) {
          $scope.query.schedule = newSchedule;
          $scope.saveQuery();
        }
      };
    },
  };
}

function queryDayPicker() {
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  let templateString = '<br>';
  WEEKDAYS.forEach((day) => {
    templateString += `<label><input type='radio' ng-model="days" value="${day}"> ${day}</label><br/>`;
  });

  return {
    restrict: 'E',
    scope: {
      query: '=',
      saveQuery: '=',
    },
    template: templateString,
    link($scope) {
      $scope.updateSchedule = () => {
        const newSchedule = moment().hour($scope.hour)
          .minute($scope.minute)
          .utc()
          .format('HH:mm');

        if (newSchedule !== $scope.query.schedule) {
          $scope.query.schedule = newSchedule;
          $scope.saveQuery();
        }
      };
    },
  };
}

function scheduleUntil() {
  return {
    restrict: 'E',
    scope: {
      query: '=',
      saveQuery: '=',
    },
    template: '<input type="datetime-local" step="1" class="form-control" ng-model="query.scheduleUntil" ng-change="saveQuery()">',
  };
}

const ScheduleForm = {
  controller() {
    this.query = this.resolve.query;
    this.saveQuery = this.resolve.saveQuery;
    this.showTimePicker = true;
    this.showDays = true;
  },
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&',
  },
  template,
};

export default function init(ngModule) {
  ngModule.directive('queryIntervalPicker', queryIntervalPicker);
  ngModule.directive('queryTimePicker', queryTimePicker);
  ngModule.directive('queryDayPicker', queryDayPicker);
  ngModule.directive('scheduleUntil', scheduleUntil);
  ngModule.component('scheduleDialog', ScheduleForm);
}
