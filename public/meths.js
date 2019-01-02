
var req = { board: tf.zeros([10, 10]), left: tf.zeros([4, 1]) };

function request() {
  let xhttp = new XMLHttpRequest();

  xhttp.open("POST", "/data", true);
  xhttp.setRequestHeader("Content-Type", "application/json");

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText);
      display(data);
    }
  };

  xhttp.send(JSON.stringify(req));
}


function resp() {
  let xhttp = new XMLHttpRequest();

  xhttp.open("GET", "/data", true);
  xhttp.setRequestHeader("Content-Type", "application/json");

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText);
      display(data);
    }
  };

  xhttp.send();
}


function display(data) {
  console.log(data);
}
