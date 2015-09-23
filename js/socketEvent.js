io = io.connect()

io.emit('stream');

var count = function counter(){
  var number = 1;
  return function(){
    return number++;
  }
}();

io.on('newIntel', function(data) {


console.log(data);
  data = JSON.parse(data);
  var newIntel = document.createElement("LI");
  newIntel.id = data.id;

  var liClass = count()%2 === 0 ? '' : 'timeline-inverted';
  newIntel.innerHTML = '<li class="' +liClass+ '"><div class="timeline-badge"><i class="glyphicon glyphicon-check"></i></div><div class="timeline-panel"><div class="timeline-heading"><h4 class="timeline-title">' + data.headline+ '</h4><p><small class="text-muted"><i class="glyphicon glyphicon-time"></i>' + data.time+ '</small></p></div><div class="timeline-body"><p>' + data.content+ '</p></div></div></li>';
console.log(newIntel.innerHTML);

  $('.timeline').append(newIntel);
});
