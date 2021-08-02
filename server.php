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
const serverVersion = "KD Server 1.0 (alpha) 2021\n";

//Get request from user:
$message = KDMessage::fromRequest(messageSymbol);

//Filter messages to system:
if ($message->destination == "server") {
    $tokens = $message->getTokens();
    switch ($tokens[0]) {
        case "ping":
            echo serverVersion;
            break;

            /**
             * 
             * retrieve messages via
             * the producer of the message that made the call to getMessages
             */
        case "getMessages":
            $u = KDUser::read($message->producer);
            $index = $u->lastMessageIndex;
            $qm = new KDMessagesQueue();
            echo json_encode($qm->getMessagesOfProducer($u->getFullName(), $index));
            break;


        case "create":
            //Create a new user
            if ($tokens[1] == "user") {
                $fullName = $tokens[2];
                if ($fullName == null) {
                    $fullName = $message->producer;
                }
                $u = new KDUser($fullName);
                try {
                    $u->create();
                } catch (KDUserExitsException $ex) {
                    die($ex->getMessage());
                }
            }
            break;

        default:
            $qm = new KDMessagesQueue();
            $qm->append($message);
            //echo $message->toString();
            break;
    }
}
