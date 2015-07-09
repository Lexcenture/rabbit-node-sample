io = io.connect()

io.emit('stream')

io.on('newIntel', function(data) {
  $('#intel_list').append('<p>Intelligence! ' + data.toString() +'</p>')
})
