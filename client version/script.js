/*!
* Tim (lite)
*   github.com/premasagar/tim
*//*
    A tiny, secure JavaScript micro-templating script.
*/
var tim=function(){var e=/{{\s*([a-z0-9_][\\.a-z0-9_]*)\s*}}/gi;return function(f,g){return f.replace(e,function(h,i){for(var c=i.split("."),d=c.length,b=g,a=0;a<d;a++){b=b[c[a]];if(b===void 0)throw"tim: '"+c[a]+"' not found in "+h;if(a===d-1)return b}})}}();

var ids,
    following,
    MAX_CONCURRENT_REQS = 2;

// API urls

function getUser (obj) {
  var params = (obj.screenName) ? 'screen_name=' + obj.screenName : 'user_id=' + obj.userid;
  return 'https://api.twitter.com/1/users/show.json?' + params + '&callback=?';
}

function getFollowing (obj) {
  var params = (obj.screenName) ? 'screen_name=' + obj.screenName : 'user_id=' + obj.userid;
  return 'https://api.twitter.com/1/following/ids.json?' + params + '&callback=?';
}

// start() is called from the html button.
// It gets the following ids.

function start () {
  var screenName = jQuery('#screenname')[0].value;

  // "Reset app" to starting state

  ids = following = [];
  jQuery('#output').empty();

  // Get all following ids then get their full user objects
  // (does not account for pagination)

  jQuery.getJSON(getFollowing({screenName: screenName}), function (data) {
    ids = data.ids;
  })
  .then(buildFollowing);
}


// Get full user objects from the following ids.
// User async.queue is used to handle a maximum concurrency.
// (Might not actually be needed)

function buildFollowing () {

  // Create queue object
  var q = async.queue(function (task, callback) {
    jQuery.getJSON(getUser({userid: task.id}), function (data) {
      following.push(data);
      callback();
    })
    .error(function () {
      show();
      message('Bad request: Twitter rate limit.');
    })
  }, MAX_CONCURRENT_REQS);


  // When all tasks processed
  q.drain = function () {
    show();
  }

  // Push to queue
  jQuery.each(ids, function (i, id) {
    q.push({id: id}, function () {
      console.log('Fetched ' + id);
    });
  });
}


// GUI Feedback

function show () {
  var output = jQuery('#output'),
      personTemplate = "<div class='person'><ul><li><img src='{{https://si0.twimg.com/profile_images/1559797084/newprofile3_normal.jpg}}' alt='{{screen_name}}'></li><li>{{screen_name}}</li><li>{{last_update}}</li></ul></div>";

  // Append a person to #output
  jQuery.each(following, function (i, person) {
    person.status = (person.status) ? person.status[0].created_at : 'No status (latest tweet) found';
    output.append(tim(personTemplate, person));
  });

  message('Listed following.');
}

function message (msg) {
  document.getElementById('message').innerHTML = msg;
}