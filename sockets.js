
var socketio = require('socket.io')
var points = require('./points')


/*
This file basically has all the de facto request handlers for rhombus.  
All the method calls themselves are defined in points.js and are called with
a callback in which the socket response is emitted.  This is to make the code 
cleaner if a request has to make an asynchronous database query.  
*/


module.exports.listen = function(app){
  io = socketio.listen(app)

  var num_watchers = 0

  io.sockets.on('connection', function (socket) {
    if(num_watchers == 0){
      points.init(function(){
        console.log('initialized')
      })
    }

    num_watchers++

    //the homepage. Update discussions returns the list of original posts
    socket.on('request_discussions', function(data){
      points.getOriginals(function(list){
        socket.emit('update_discussions', list)
      })
    })

    //a request is sent with a point id.
    socket.on('request', function(data){
      var request_id = parseInt(data.point_id)
      if(!isNaN(request_id)){
        points.request(request_id, function(requested){
          socket.emit('update', requested)

        })
      }
      else{
        console.log('user requested ' + data.point_id + ' which is not a number')
      }
 
    })

    //a request to make a new point and the point information.
    socket.on('new_point', function (data) {
      points.new_point(data, function(modified){
        socket.emit('update', modified)
        socket.broadcast.emit('update', modified)
      })
      
    });

    socket.on('disconnect', function (data) {
      console.log('client disconnected')

      --num_watchers

      if(num_watchers == 0){
        points.cleanup(function(){
          console.log('cleaned up')
        })
      }

    })


  })


}