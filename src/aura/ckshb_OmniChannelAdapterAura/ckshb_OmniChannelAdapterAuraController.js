({
    onInit : function(component, event, helper) {
        helper.invokeAction(
            component,
            {
                name: 'getSessionId'
            },
            function(err, value) {
                if (err) {
                    // todo: handle error
                } else {
                    component.set('v.sessionId', value);
                    component.set('v.channel', '/topic/MemberPushTopic');
                    var connect = function(options) {
                        var onData = $A.getCallback(function(data) {
                            console.log(data);
                        });
                        helper.subscribe({
                            sessionId: options.sessionId,
                            channel: options.channel
                        }, onData);
                    };
                    helper.afterResourcesAndDataLoaded(component, connect);
                }
            }
        );
    },
})