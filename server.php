<?php
include("kd2021.php");

/**
 * KicsyDell Server
 * version 1.0 2021/July
 * 
 */


$kdphp = new KDPHP();
const messageSymbol = "m";
const generic = "generic";

//Get request from user:
$message = KDMessage::fromRequest(messageSymbol);

//Filter messages to system:
if ($message->destination == "system") {
   // print_r($message->tokens());
    $tokens = $message->tokens();

    switch ($tokens[0]) {

        /**
         * 
         * retrieve messages via
         * the producer of the message that made the call to getMessages
         */
        case "getMessages":
            /*
            $n = $tokens[1]; //name
            $o = $tokens[2]; //organization 
            $u = KDUser::read($n, $o);
            */

            $u = KDUser::readByFullName($message->producer);
            $index = $u->lastMessageIndex;
            $qm = new KDMessagesQueue();
            echo json_encode($qm->getMessagesOfConsumer($u->fullName(), $index));

            break;

            //Create a new user
        case "create":
            if ($tokens[1] == "user") {
                $name =  $tokens[2];
                $organization = $tokens[3];
                if ($organization == null) {
                    $organization = generic;
                }
                $u = new KDUser($name, $organization);
                $u->create();
            }
    }
} else {
    $qm = new KDMessagesQueue();
    $qm->append($message);
    echo $message->toString();
}
