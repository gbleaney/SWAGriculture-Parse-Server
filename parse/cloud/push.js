module.exports = {
  sendPush: function(name) {
    return Parse.Push.send({
      channels: [""],
      data: {
        alert: "Your trap: '" + name + "' was just triggered!"
      }
    })
  }
}