var request             = require('request'),
    async               = require('async'),
    ids                 = [],
    following           = [],
    MAX_CONCURRENT_REQS = process.argv[3] || 2;

// Get following ids

request(getFollowing({screenName: process.argv[2]}), function (err, response, body) {
  if (responseOK(response.statusCode, body)) {
    ids = JSON.parse(body).ids;
    buildFollowing();
  }
});

// Get full user objects from following ids
// User async.queue to handle a maximum concurrency

function buildFollowing () {
  var q = async.queue(function (task, callback) {
    request(getUser({userid: task.id}), function (err, response, body) {
      if (responseOK(response.statusCode, body)) {
        following.push(JSON.parse(body));
        callback();
      }
    });
  }, MAX_CONCURRENT_REQS);

  q.drain = function () {
    /* When all tasks processed */
    console.log(following);
  }

  ids.forEach(function (id) {
    q.push({id: id}, function () {
      console.log('Fetched ' + id);
    });
  });
}


// API Urls

function getUser (obj) {
  var params = (obj.screenName) ? 'screen_name=' + obj.screenName : 'user_id=' + obj.userid;
  return 'https://api.twitter.com/1/users/show.json?' + params;
}

function getFollowing (obj) {
  var params = (obj.screenName) ? 'screen_name=' + obj.screenName : 'user_id=' + obj.userid;
  return 'https://api.twitter.com/1/following/ids.json?' + params;
}

// Misc

function responseOK (statusCode, body) {
  if (statusCode === 200 || statusCode === 304) {
    return true;
  } else {
    console.log('Request failed, status code: ' + statusCode + ' body: ' + body);
    return false;
  }
}