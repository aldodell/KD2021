/*
class KDUserApp extends KDApplication {
    constructor(kernel) {
        super(kernel);
        this.id = "user";
    }

    processMessage(message) {
        if (message.destination == this.id) {
            let tokens = message.getTokens();
            let fullname = tokens[1];
            let hashPassword = this.hash(tokens[2]);
            let theKernel = this.kernel;

            switch (tokens[0]) {
                case "login":
                    let ma = kdMessage("server",
                        "login " + fullname + " " + hashPassword,
                        this.id,
                        "",
                        ""
                    );

                    this.kernel.sendRemoteMessage(ma, function (answer) {
                        let obj = JSON.parse(answer);
                        if (obj.name) {
                            let u = new KDUser();
                            theKernel.currentUser = u.fromJson(answer);
                            let m0 = kdMessage("terminal", "print User loaded!", this.id, theKernel.currentUser, theKernel.currentUser);
                            let m1 = kdMessage("terminal", "setPrefix " + u.fullName(), this.id, theKernel.currentUser, theKernel.currentUser);
                            theKernel.sendLocalMessage(m0);
                            theKernel.sendLocalMessage(m1);
                        } else {
                            let m = new KDMessage();
                            m = m.fromJson(answer);
                            theKernel.sendLocalMessage(m);
                        }
                    });
                    break;

                case "create":
                    let mb = kdMessage("server",
                        "create user " + fullname + " " + hashPassword,
                        this.id,
                        "",
                        ""
                    );

                    this.kernel.sendRemoteMessage(mb, function (answer) {
                        let obj = JSON.parse(answer);
                        if (obj.name) {
                            let u = new KDUser();
                            theKernel.currentUser = u.fromJson(answer);
                            let m0 = kdMessage("terminal", "print user create!", this.id, theKernel.currentUser, theKernel.currentUser);
                            theKernel.sendLocalMessage(m0);
                        } else {
                            let m = new KDMessage();
                            m = m.fromJson(answer);
                            theKernel.sendLocalMessage(m);
                        }
                    });
                    break;
            }
        }
    }
}
*/


  /*
             if (tokens.length >= 1) {
                 //If the message is for server
                 if (message.destination == this.id) {
 
                     //get consumer
                     let consumer = message.reducePayload();
 
                     //get destination
                     let destination = message.reducePayload();
 
                     //assign
                     message.consumer = consumer;
                     message.destination = destination;
 
                     //the producer is de current user logged
                     message.producer = this.kernel.currentUser.fullName();
                     message.origin = this.id;
                     let theKernel = this.kernel;
 
                     //Send de message to server
                     theKernel.sendRemoteMessage(
                         message,
                         //Process answer from server
                         function (answer) {
                             //alert(answer);
                             try {
 
                                 //if answer is a JSON we can assume that is a message
                                 //let json = JSON.parse(answer);
                                 let m = new KDMessage();
                                 m.fromJson(answer);
 
                                 //Send the message locally
                                 theKernel.sendLocalMessage(m);
                             } catch (error) {
                                 theKernel.print(error);
                             }
 
                         },
                         theKernel.print
                     )
                 }
             }
             */