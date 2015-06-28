module.exports = {
  sendPush: function(name) {
    Parse.Push.send({
      channels: [""],
      data: {
        alert: "Your trap: '" + name + "' was just triggered!"
      }
    })
  }
}