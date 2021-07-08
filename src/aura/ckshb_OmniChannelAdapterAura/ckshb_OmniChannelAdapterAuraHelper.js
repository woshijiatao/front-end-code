({
    subscribe: function(options, callback) {
        var cometd = new window.CharketCometd();
        var channel = options.channel;
        var sessionId = options.sessionId;
        var self = this;
        var replayId = -1;
        var subscribedToChannel;

        cometd.websocketEnabled = false;
        cometd.configure({
            url: '/cometd/40.0',
            requestHeaders: { Authorization: 'OAuth ' + sessionId },
            appendMessageTypeToURL: false,
            maxURILength: 99999
        });
        cometd.addListener(
            '/meta/handshake',
            $A.getCallback(function(message) {
                console.log(message);
                if (message.successful) {
                    if (channel) {
                        registerExtension('replayFrom', channel);
                        subscribedToChannel = subscribe(channel);
                    }
                }
            })
        );

        cometd.addListener('/meta/subscribe', function(message) {
            console.log(message);
        });

        cometd.handshake();

        function subscribe(channel) {
            return cometd.subscribe(channel, function(response) {
                console.log(response);
                replayId = response.data.event.replayId;
                callback(response.data.sobject);
            });
        }

        function registerExtension(extensionName, channel) {
            var replayExtension = self.getCometdReplayExtension(cometd);
            var channelWithoutFilter = channel.indexOf('?') >= 0
                ? channel.substring(0, channel.indexOf('?'))
                : channel;
            replayExtension.setChannel(channelWithoutFilter);
            replayExtension.setReplay(replayId);
            replayExtension.setExtensionEnabled(true);
            cometd.registerExtension(extensionName, replayExtension);
        }
    },

    getCometdReplayExtension: function(cometd) {
        var cometdReplayExtension = function() {
            var REPLAY_FROM_KEY = 'replay';

            var _cometd;
            var _extensionEnabled;
            var _replay;
            var _channel;

            this.setExtensionEnabled = function(extensionEnabled) {
                _extensionEnabled = extensionEnabled;
            };

            this.setReplay = function(replay) {
                _replay = parseInt(replay, 10);
            };

            this.setChannel = function(channelName) {
                _channel = channelName;
            };

            this.registered = function(name, cometdObject) {
                _cometd = cometdObject;
            };

            this.incoming = function(message) {
                if (message.channel === '/meta/handshake') {
                    if (message.ext && message.ext[REPLAY_FROM_KEY]) {
                        _extensionEnabled = true;
                    }
                } else if (
                    message.channel === _channel &&
                    message.data &&
                    message.data.event &&
                    message.data.event.replayId
                ) {
                    _replay = message.data.event.replayId;
                }
            };

            this.outgoing = function(message) {
                if (message.channel === '/meta/subscribe') {
                    if (_extensionEnabled) {
                        if (!message.ext) {
                            message.ext = {};
                        }

                        var replayFromMap = {};
                        replayFromMap[_channel] = _replay;
                        message.ext[REPLAY_FROM_KEY] = replayFromMap;
                    }
                }

                if (message.channel === '/meta/connect') {
                    message.advice = {
                        interval: 0,
                        timeout: 40000
                    };
                }
            };
        };
        return new cometdReplayExtension();
    },

    afterResourcesAndDataLoaded: function(component, callback) {
        var timer = window.setInterval(function() {
            var sessionId = component.get('v.sessionId');
            var channel = component.get('v.channel');

            if (sessionId && channel) {
                clearInterval(timer);
                callback({
                    sessionId: sessionId,
                    channel: channel
                });
            }
        }, 1000);
    },

    invokeAction: function(component, options, callback) {
        var action = component.get('c.' + options.name);
        if (options.params) {
            action.setParams(options.params);
        }
        action.setCallback(this, function(response) {
            var state = response.getState();
            console.log(state)
            if (state === 'SUCCESS') {
                var result = JSON.parse(response.getReturnValue());
                console.log(result);
                if (result.ok) {
                    callback(null, result.data);
                } else {
                    var serverError = new Error(result.error);
                    serverError.code = 'server_error';
                    callback(serverError);
                }
            } else {
                var clientError = new Error(state); // todo: improve error message
                clientError.code = 'client_error';
                callback(clientError);
            }
        });

        $A.enqueueAction(action);
    }
})