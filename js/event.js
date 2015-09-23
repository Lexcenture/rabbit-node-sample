var eventHandler = {
  publish: function (intelList) {

    var source;
    console.log('Publish');
    if (!!window.EventSource) {

      source = new EventSource("/stream");
      source.addEventListener("open", function (event) {
        console.log("Successfully Connected. State: %s", event.target.readyState);
        setTimeout(function () {
          console.log('Attempting to reload. Status: ', source.readyState === EventSource.CLOSED);
          if (source.readyState === EventSource.CLOSED) {
            console.log('Actually reloading the page.');
            location.reload();
          }
        }, 10000);

      }, false);

      source.addEventListener("message", function (event) {
        console.log('Message');
        var newIntel;
        try {
          newIntel = JSON.parse(event.data);

          alert(event.data);

        }
        catch (e) {
          console.log('Received an invalid json object.');
          return;
        }

        var newIntelNode = document.createElement("LI");
        newIntelNode.id = newIntel.id;

        newIntelNode.innerHTML = ['<h3>', newIntel.headline, '</h3><p>', newIntel.content, '</p>'].join('');
        intelList.insertBefore(newIntelNode, intelList.firstChild);

      }, false);

      source.addEventListener("error", function (event) {
        if (event.target.readyState === EventSource.CLOSED) {
          source.close();
          console.log("Connection closed!");
        } else if (event.target.readyState === EventSource.CONNECTING) {
          console.log("Connection closed. Attempting to reconnect!");
        } else {
          console.log("Connection closed. Unknown error!");
        }
      });

    } else {
      console.log('Server Sent Events is not supported.');
    }

  }
}

window.addEventListener("load", function () {
  var intelList = document.getElementById("intel_list");
  eventHandler.publish(intelList);
});
