var APPLICATION_CODE = "XXXXX-XXXXX";
var pushwooshUrl = "https://cp.pushwoosh.com/json/1.3/";
var hwid = "hwid";

self.addEventListener('push', function (event) {
// Since there is no payload data with the first version
// of push messages, we'll grab some data from
// an API and use it to populate a notification
    event.waitUntil(
        fetch(pushwooshUrl + 'getLastMessage', {
            method: 'post',
            headers: {
                "Content-Type": "text/plain;charset=UTF-8"
            },
            body: '{"request": {"application": "' + APPLICATION_CODE + '","hwid": "' + hwid + '"}}'
        }).then(function (response) {
            if (response.status !== 200) {
                // Either show a message to the user explaining the error
                // or enter a generic message and handle the
                // onnotificationclick event to direct the user to a web page
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                throw new Error();
            }

            // Examine the text in the response
            return response.json().then(function (data) {
                if (!data.response.notification) {
                    console.error('The API returned an error.', data.error);
                    throw new Error();
                }
                var notification = data.response.notification;
                console.log(notification);

                var title = notification.chromeTitle || 'Title';
                var message = notification.content;
                var icon = notification.chromeIcon || 'https://cp.pushwoosh.com/img/logo-medium.png';
                var messageHash = notification.messageHash;
                var url = notification.url;

                return self.registration.showNotification(title, {
                    body: message,
                    icon: icon,
                    tag: messageHash,
                    url: url
                });
            });
        }).catch(function (err) {
            console.error('Unable to retrieve data', err);

            var title = 'An error occurred';
            var message = 'We were unable to get the information for this push message';
            var notificationTag = 'notification-error';
            return self.registration.showNotification(title, {
                body: message,
                tag: notificationTag
            });
        })
    );
});


self.addEventListener('notificationclick', function(event) {  
  var messageHash = event.notification.tag;
  console.log(event.notificaiton);
  console.log(event);
  console.log("Push open hwid = " + hwid + " messageHash = " + messageHash);
     event.waitUntil(
        fetch(pushwooshUrl + 'pushStat', {
            method: 'post',
            headers: {
                "Content-Type": "text/plain;charset=UTF-8"
            },
            body: '{"request": {"application": "' + APPLICATION_CODE + '","hwid": "' + hwid + '", "hash": "' + messageHash+ '"}}'
        }).then(function (response) {
          console.log(response);
        }
    ));
  // Android doesn't close the notification when you click on it  
  // See: http://crbug.com/463146  
  event.notification.close();

   // This looks to see if the current is already open and  
  // focuses if it is  
  event.waitUntil(
    clients.matchAll({  
      type: "window"  
    })
    .then(function(clientList) {  
      for (var i = 0; i < clientList.length; i++) {  
        var client = clientList[i];  
        if (client.url == '/' && 'focus' in client)  
          return client.focus();  
      }  
      if (clients.openWindow) {
        if (event.notification.url)
          return clients.openWindow(event.notification.url);
        return clients.openWindow('/');  
      }
    })
  );
});

self.addEventListener('message', function (evt) {
  console.log('postMessage received', evt.data);
  pushwooshUrl = evt.data.pushwooshUrl;
  APPLICATION_CODE = evt.data.applicationCode;
  hwid = evt.data.hwid;
});