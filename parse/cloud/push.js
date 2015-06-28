module.exports = {
  sendPush: function() {
    Parse.Push.send({
      channels: [""],
      data: {
        alert: "Trap went off"
      }
    })
  }
}