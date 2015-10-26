// Just took the angular limitTo filter:
// https://github.com/angular/angular.js/blob/ecf9304811a0fd54289a35b9c3b715a1d4447806/src/ng/filter/limitTo.js
var __className = 'limitTo';
$require(__className, ['filters', 'utils'], function(filters, utils) {

  var isNumber = function(input) {
    return utils.typeof(input) === 'number';
  };

  var isString = function(input) {
    return utils.typeof(input) === 'string';
  };

  var toInt = function(input) {
    return parseInt(input, 10);
  };

  var isArray = function(input) {
    return utils.isArray(input);
  };

  var limitTo = function(input, limit, begin) {
    if (Math.abs(Number(limit)) === Infinity) {
      limit = Number(limit);
    } else {
      limit = toInt(limit);
    }
    if (isNaN(limit)) return input;

    if (isNumber(input)) input = input.toString();
    if (!isArray(input) && !isString(input)) return input;

    begin = (!begin || isNaN(begin)) ? 0 : toInt(begin);
    begin = (begin < 0) ? Math.max(0, input.length + begin) : begin;

    if (limit >= 0) {
      return input.slice(begin, begin + limit);
    } else {
      if (begin === 0) {
        return input.slice(limit, input.length);
      } else {
        return input.slice(Math.max(0, begin + limit), begin);
      }
    }
  };

  return filters.addFilter(limitTo);
});