class KDUserManager extends KDApplication {
    constructor() {
        super();
        this.id = "user"
    }
    processMessage(m) {
        if (m.destination == this.id) {
            switch (m.tokens[0]) {
                case "create":
                    break;

                case "login":
                    break;

                case "logout":
                    break;
            }

        }

    }
}